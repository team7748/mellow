# Profile Activity and Settings Design

## Objective

Make the existing Mellow Profile page production-ready without changing its visual identity or replacing the current Auth, Profile, Guest Mode, or Learning Activity systems. The page will show real seven-day activity, persist user settings to Supabase, apply those settings across the application, support profile and password management, and deliver scheduled Web Push reminders.

## Confirmed Constraints

- Keep React, TypeScript, Tailwind CSS, and the current Profile page layout and component vocabulary.
- Reuse `learning_activity_events`, its local-first ledger, and its existing cloud synchronization.
- Do not introduce mock data or a second learning history system.
- Preserve Supabase Auth, profile creation, avatar storage, Guest Mode, and existing learning behavior.
- Store authenticated-user preferences in Supabase and make each preference affect real application behavior.
- Keep guest preferences local and isolated from authenticated user preferences.
- Use test-driven development for application behavior and verify Build, TypeScript, Lint, Tests, and browser runtime.

## Existing Systems to Reuse

### Learning activity

`learning_activity_events` already records and synchronizes these modes:

- Flashcard: `vocabulary_answer` / `flashcard`
- Quiz: `vocabulary_answer` / `quiz`
- Grammar: `grammar_answer` / `grammar`
- Speak: `conversation_completed` / `speak`

The existing local ledger remains the immediate UI source. Auth synchronization continues to merge the local and cloud ledgers. Profile summaries will derive from this ledger instead of querying or storing a second summary table.

### Profile and Auth

The existing `profiles` row, `useProfile`, `profileService`, avatar bucket, password-reset service, `useAuth`, and logout flow remain authoritative. Name and avatar editing will be hardened rather than rebuilt.

### Speech

The existing `speechSettings` module, `SpeechSettings` component, and `SpeakButton` integration will be extended. The existing LocalStorage key will be migrated rather than abandoned so guest behavior remains compatible.

## Chosen Architecture

Use a dedicated one-row-per-user preferences table alongside the existing profile table. Preferences are application behavior and are kept separate from identity fields such as name, email, role, and avatar. A React settings provider loads defaults synchronously from a local cache, then reconciles authenticated users with Supabase. This keeps Guest Mode usable and gives all routes one typed source of truth.

Extend the existing Learning Activity ledger with timed practice segments. This is an additional event kind in the same ledger, not a second analytics system. Seven-day summaries and goals are pure derived data.

Push reminders use a standards-based Service Worker and Push API subscription. Supabase stores subscriptions, an Edge Function sends due notifications, and Supabase Cron invokes that function. An authenticated user's row-level policies only expose their own preferences and subscriptions.

## Supabase Changes

### Migration

Create `supabase/migrations/006_profile_settings_and_reminders.sql`.

The migration must be safe to apply once to the current hosted project and must not drop existing profile or activity data.

### Table: `public.user_preferences`

One row per authenticated user:

| Column | Type | Default | Purpose |
| --- | --- | --- | --- |
| `user_id` | `uuid` primary key | none | References `auth.users(id)` with cascade delete |
| `daily_vocabulary_goal` | `integer` | `10` | Vocabulary actions desired per local day |
| `daily_practice_minutes` | `integer` | `15` | Active learning minutes desired per local day |
| `reminder_enabled` | `boolean` | `false` | Whether scheduled reminders are active |
| `reminder_time` | `time` | `19:00` | Reminder time in the user's timezone |
| `timezone` | `text` | `Asia/Bangkok` | IANA timezone used by the sender |
| `language` | `text` | `th` | `th` or `en` |
| `speech_locale` | `text` | `en-US` | English pronunciation locale |
| `speech_voice_uri` | `text` nullable | `null` | Browser voice preference when available |
| `speech_rate` | `numeric` | `1` | Playback rate from `0.5` through `2` |
| `speech_auto_play` | `boolean` | `false` | Automatically pronounce newly presented study content |
| `theme` | `text` | `system` | Legacy compatibility column; retained in Supabase but not read or written by the frontend |
| `created_at` | `timestamptz` | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `now()` | Updated by the existing timestamp trigger pattern |

Database checks enforce the numeric ranges and enum values. RLS is enabled. Authenticated users receive `SELECT`, `INSERT`, and explicit-column `UPDATE` privileges, with ownership policies using `(select auth.uid()) = user_id` in both `USING` and `WITH CHECK`.

### Table: `public.push_subscriptions`

One row per browser subscription:

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | `uuid` primary key | Generated subscription row identifier |
| `user_id` | `uuid` | Owner, referencing `auth.users(id)` with cascade delete |
| `endpoint` | `text unique` | Browser push endpoint |
| `p256dh` | `text` | Push encryption key |
| `auth_key` | `text` | Push authentication secret |
| `user_agent` | `text` nullable | Helps identify stale device subscriptions |
| `last_notified_local_date` | `date` nullable | Prevents duplicate reminders on the same local day |
| `created_at` | `timestamptz` | Creation timestamp |
| `updated_at` | `timestamptz` | Update timestamp |

RLS permits authenticated users to select, insert, update, and delete only their own subscriptions. The Edge Function reads subscriptions with the server-side service role; that secret is never exposed to React.

### Existing table: `public.learning_activity_events`

Extend the existing kind constraint with `practice_time`. The event continues to use the existing modes `flashcard`, `quiz`, `grammar`, and `speak`. Its metadata adds `durationSeconds` and `sessionId`. Existing rows remain valid.

Practice-time events are excluded from action-count totals so the current home mission bars do not increase twice. They are included only in time totals and mode-duration breakdowns.

### Edge Function and scheduled execution

Add `supabase/functions/send-learning-reminders/index.ts`.

The function will:

1. Authenticate the scheduled invocation with a dedicated secret.
2. Read enabled user preferences and their push subscriptions using the service role.
3. Resolve each user's local date and time with the stored IANA timezone.
4. Send only when the configured minute is due and `last_notified_local_date` is not today.
5. Remove subscriptions that the push provider reports as expired.
6. Update the last-notified date only after a successful send.

Supabase Cron invokes the Edge Function every minute. Deployment requires VAPID keys and these secrets:

- Frontend: `VITE_WEB_PUSH_PUBLIC_KEY`
- Edge Function: `WEB_PUSH_PUBLIC_KEY`
- Edge Function: `WEB_PUSH_PRIVATE_KEY`
- Edge Function: `WEB_PUSH_SUBJECT`
- Edge Function: `REMINDER_CRON_SECRET`

The implementation handoff will include exact Supabase CLI and Dashboard instructions. The migration, Edge Function, and application code can be committed locally, but scheduled notifications become live only after the migration is applied, the function is deployed, the secrets are configured, and the Cron job is enabled in the user's Supabase project.

## Seven-Day Activity

A pure summary function receives ledger events and a current local date and returns seven ordered day records. Each record contains:

- Local date and localized weekday label
- Flashcard action count
- Quiz action count
- Grammar action count
- Speak completion count
- Total action count excluding `practice_time`
- Active practice seconds by mode

The current seven-bar visual remains. Each bar represents that day's total actions. Selecting or focusing a bar reveals the per-mode breakdown and practiced minutes below the chart. Today retains the existing primary-green emphasis. Empty and loading states retain the current quiet visual style.

The hook updates immediately when local activity changes and again after authenticated cloud synchronization. No summary rows are stored in Supabase.

## Real Learning-Time Tracking

A reusable active-session hook is mounted only on actual practice surfaces. It accumulates time while the page is visible and the learner is active, pauses when the tab is hidden, and closes a segment on route exit. Segments are capped and periodically flushed to the existing local-first ledger so a browser close does not lose the whole session.

Idle time is not counted. The hook records `practice_time` events with the relevant mode and a unique session identifier. Daily time-goal progress sums `durationSeconds` for the current local date.

## Settings Behavior

### Learning goals

The user can set vocabulary actions and active practice minutes per day. Vocabulary progress counts real Flashcard and Quiz vocabulary-answer events. Time progress sums `practice_time` events. Home and Profile read the same preference-backed targets.

### Notifications

Enabling reminders requests browser notification permission, registers the Service Worker, creates a Push API subscription, and upserts it into Supabase. Disabling reminders deletes that browser subscription row and unsubscribes the browser. The UI explicitly handles unsupported browsers, blocked permission, missing VAPID configuration, and network failure.

### Language

A typed translation provider supports Thai and English for navigation, page headings, controls, validation, empty states, and feedback on all currently routed application screens. Existing vocabulary and grammar datasets remain bilingual and are not rewritten. The provider updates `document.documentElement.lang` immediately.

### Speech and pronunciation

The settings expose pronunciation locale, an available browser voice, playback speed, and Auto Play. `SpeakButton` uses the selected voice and rate. Study screens that present a new word or conversation line honor Auto Play without speaking twice during React development rendering.

### Display

Mellow uses Light mode only. The profile has no display-theme menu, the root document declares a light color scheme, and the legacy database column remains unchanged for schema compatibility.

### Personal data

Name and avatar continue to use `profiles` and the existing `avatars` bucket. Saving the name updates both Profile state and authenticated user metadata where appropriate. Avatar replacement uploads the new file, updates the profile row, and removes the previous owned file only after the database update succeeds.

### Security

The security section supports:

- Direct password update for a valid authenticated recovery/session flow
- Password-reset email sent to the current account email
- Clear success and translated Supabase error states

Passwords are never stored outside Supabase Auth.

### Logout

Logout continues through Supabase Auth and preserves guest-local learning data. Loading and failure feedback are visible, and successful sign-out follows the existing Auth state transition and routing.

## UI Structure

The existing Profile header, learner stats, weekly chart, and settings list remain in the same order. Each settings row becomes an accessible disclosure that expands inline. Only one row is expanded at a time on small screens to keep cognitive load low. Save status appears inside the expanded region, and controls use the existing border, radius, focus, and primary-button vocabulary.

No nested card grid, decorative animation, heavy shadow, glass effect, or new visual language is introduced. Motion is limited to 150–250 ms state transitions and respects reduced-motion preferences.

## State and Error Handling

- Initial authenticated settings use the local cache, then reconcile with Supabase.
- A remote fetch failure keeps the last valid cache and shows a retryable status.
- Saves are validated before network calls and disable only the affected section.
- Failed saves roll the control back to its last persisted value.
- Guest Mode never attempts authenticated preference or push-subscription writes.
- Profile remains protected by the existing route guard; no Auth behavior is bypassed.
- Push permission denial is treated as a durable user choice, not a generic application error.

## Testing Strategy

### Unit tests

- Seven-day boundaries, mode breakdowns, and timezone-safe date handling
- Time-segment aggregation and exclusion from action counts
- Preference normalization, validation, local cache migration, and legacy-theme omission
- Translation fallback and document language updates
- Speech voice/rate selection and Auto Play guards
- Push subscription serialization and permission states
- Supabase row mapping and error behavior

### Component tests

- Profile chart renders real ledger data and selected-day details
- Every settings disclosure opens, validates, saves, and reports errors
- Language, speech, profile, password reset, and logout call their real service boundaries
- Guest Mode does not issue authenticated writes

### Integration and runtime verification

- Existing Learning Activity sync tests remain green
- Build runs TypeScript and Vite production compilation
- Full ESLint scan runs across `src` and `api`
- Full Vitest suite runs serially if needed for stability
- Browser smoke covers Profile on mobile and desktop widths, main routes, enforced Light mode, language changes, avatar flow, and browser notification capability states
- Hosted Supabase verification runs a preference insert/update/select under an authenticated user when project credentials and migration access are available

## Deployment Handoff

At completion, the report will separate local code verification from hosted Supabase activation. It will list:

1. The migration file to apply.
2. The two new tables and the existing activity constraint change.
3. The Edge Function to deploy.
4. The VAPID and Cron secrets to configure.
5. The Cron schedule to enable.
6. A signed-in verification checklist for preferences, avatar storage, password reset, Push subscription, and RLS isolation.
