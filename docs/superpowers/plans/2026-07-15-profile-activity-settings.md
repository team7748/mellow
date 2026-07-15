# Profile Activity and Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Mellow Profile page into a real seven-day learning dashboard and user-settings surface backed by the existing Learning Activity ledger, Supabase, Web Speech, Web Push, and Supabase Auth.

**Architecture:** Keep the existing local-first activity ledger as the source of learning history and extend it with timed practice events. Add a one-row-per-user preferences repository with a local cache, a global provider that applies theme/language/speech settings, and a separate push-subscription repository plus scheduled Supabase Edge Function. Split Profile into focused chart and settings components while preserving its current layout and design tokens.

**Tech Stack:** React 19, TypeScript 5.7, Tailwind CSS 4, Vitest, Testing Library, Supabase JS 2, PostgreSQL RLS, Supabase Storage/Auth/Edge Functions/Cron, Service Worker Push API.

## Global Constraints

- Preserve the current visual identity, Profile layout order, Auth, Profile, Guest Mode, and learning behavior.
- Reuse `learning_activity_events`; do not create a second learning-history or summary table.
- Do not use mock production data, `any`, `@ts-ignore`, `eslint-disable`, or disabled lint rules.
- New production behavior must follow Red–Green–Refactor: write and observe a failing test before implementation.
- Authenticated settings are persisted in Supabase; guest settings remain local and isolated.
- Existing vocabulary and grammar datasets remain unchanged.
- Every exposed Supabase table must enable RLS and enforce ownership with `(select auth.uid()) = user_id`.
- Push delivery is complete only after migration, Edge Function, secrets, and Cron are activated on the hosted project.

---

## File Map

### Supabase and deployment

- Create `supabase/migrations/006_profile_settings_and_reminders.sql`: preferences, push subscriptions, activity constraint, grants, RLS, triggers.
- Create `supabase/functions/send-learning-reminders/index.ts`: due-reminder selection and Web Push delivery.
- Create `docs/SUPABASE_PROFILE_SETTINGS_SETUP.md`: exact hosted activation and verification steps.

### Preferences and application-wide behavior

- Create `src/types/preferences.ts`: canonical preference types and defaults.
- Create `src/lib/preferences/preferencesStorage.ts`: local cache validation and legacy speech migration.
- Create `src/services/preferencesService.ts`: Supabase row mapping and CRUD.
- Create `src/contexts/PreferencesContext.tsx`: authenticated reconciliation, saves, theme application.
- Create `src/hooks/usePreferences.ts`: typed context access.
- Create `src/i18n/translations.ts`: Thai/English UI catalog and key types.
- Create `src/contexts/I18nContext.tsx`: translation lookup and document language.
- Modify `src/main.tsx`: provider composition.
- Modify `src/styles.css`: semantic dark-mode tokens and reduced-motion-safe transitions.

### Learning activity and goals

- Modify `src/lib/activity/activityTypes.ts`: `practice_time` and `durationSeconds`.
- Modify `src/lib/activity/activityNormalizer.ts`: validate timed metadata.
- Modify `src/lib/activity/activitySummary.ts`: preference-backed goals without double counting.
- Create `src/lib/activity/weeklyActivitySummary.ts`: seven-day per-mode summary.
- Create `src/hooks/usePracticeTimeTracker.ts`: visible, active practice timing.
- Modify `src/pages/FlashcardPage.tsx`, `src/pages/QuizPage.tsx`, `src/pages/GrammarLessonPage.tsx`, and `src/pages/SpeakModePage.tsx`: mount the timer with the correct mode.
- Modify `src/pages/HomePage.tsx`: consume user goals and translated labels.

### Profile and settings UI

- Create `src/components/profile/WeeklyActivityChart.tsx`: current chart visual plus selected-day breakdown.
- Create `src/components/profile/ProfileSettings.tsx`: accessible inline disclosures and save states.
- Modify `src/pages/ProfilePage.tsx`: compose real summaries and settings; retain identity header and statistics.
- Modify `src/services/profileService.ts`: atomic avatar replacement and explicit profile updates.
- Modify `src/services/authService.ts`: password update, reset, and observable logout result.

### Speech, language, and notifications

- Modify `src/lib/speechSettings.ts`: compatibility adapter over canonical preferences.
- Modify `src/utils/speech.ts`: voice URI selection.
- Modify `src/components/ui/SpeakButton.tsx`: global locale, voice, rate.
- Modify `src/components/settings/SpeechSettings.tsx`: provider-backed settings.
- Modify primary routed pages and layout components to use translation keys for UI chrome.
- Create `public/mellow-sw.js`: notification display and click navigation.
- Create `src/lib/notifications/pushNotifications.ts`: support checks, registration, subscribe/unsubscribe.
- Create `src/services/pushSubscriptionService.ts`: authenticated Supabase persistence.

---

### Task 1: Add the Supabase schema contract

**Files:**
- Create: `supabase/migrations/006_profile_settings_and_reminders.sql`
- Create: `src/types/preferences.ts`
- Test: `src/types/preferences.test.ts`

**Interfaces:**
- Produces: `UserPreferences`, `UserPreferencesRow`, `DEFAULT_USER_PREFERENCES`, `normalizeUserPreferences(value)`.
- Database produces: `public.user_preferences`, `public.push_subscriptions`, and `practice_time` support in `public.learning_activity_events`.

- [ ] **Step 1: Write the failing preference normalization tests**

```ts
import { describe, expect, it } from "vitest"
import {
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
} from "./preferences"

describe("normalizeUserPreferences", () => {
  it("accepts valid persisted settings", () => {
    expect(normalizeUserPreferences({
      ...DEFAULT_USER_PREFERENCES,
      language: "en",
      theme: "dark",
      dailyVocabularyGoal: 25,
      dailyPracticeMinutes: 30,
    })).toMatchObject({ language: "en", theme: "dark", dailyVocabularyGoal: 25 })
  })

  it("replaces invalid and out-of-range values with defaults", () => {
    expect(normalizeUserPreferences({
      language: "de",
      theme: "neon",
      dailyVocabularyGoal: 0,
      dailyPracticeMinutes: 999,
      speechRate: 8,
    })).toEqual(DEFAULT_USER_PREFERENCES)
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx vitest run src/types/preferences.test.ts`

Expected: FAIL because `src/types/preferences.ts` does not exist.

- [ ] **Step 3: Implement canonical types and defaults**

```ts
export type AppLanguage = "th" | "en"
export type AppTheme = "light" | "dark" | "system"

export type UserPreferences = {
  dailyVocabularyGoal: number
  dailyPracticeMinutes: number
  reminderEnabled: boolean
  reminderTime: string
  timezone: string
  language: AppLanguage
  speechLocale: "en-US" | "en-GB"
  speechVoiceUri: string | null
  speechRate: number
  speechAutoPlay: boolean
  theme: AppTheme
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  dailyVocabularyGoal: 10,
  dailyPracticeMinutes: 15,
  reminderEnabled: false,
  reminderTime: "19:00",
  timezone: "Asia/Bangkok",
  language: "th",
  speechLocale: "en-US",
  speechVoiceUri: null,
  speechRate: 1,
  speechAutoPlay: false,
  theme: "system",
}
```

Implement strict range/enum/timezone-string normalization and the snake_case `UserPreferencesRow` mapping type.

- [ ] **Step 4: Write the migration with explicit grants and RLS**

```sql
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_vocabulary_goal integer not null default 10 check (daily_vocabulary_goal between 1 and 200),
  daily_practice_minutes integer not null default 15 check (daily_practice_minutes between 1 and 240),
  reminder_enabled boolean not null default false,
  reminder_time time not null default '19:00',
  timezone text not null default 'Asia/Bangkok' check (char_length(timezone) between 1 and 64),
  language text not null default 'th' check (language in ('th', 'en')),
  speech_locale text not null default 'en-US' check (speech_locale in ('en-US', 'en-GB')),
  speech_voice_uri text,
  speech_rate numeric not null default 1 check (speech_rate between 0.5 and 2),
  speech_auto_play boolean not null default false,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Add `push_subscriptions`, replace the activity-kind check with the same existing values plus `practice_time`, enable RLS, revoke broad grants, add explicit grants, create ownership policies, add `(user_id, reminder_enabled)` and `(user_id, local_date)` indexes, and reuse `public.set_updated_at()`.

- [ ] **Step 5: Verify GREEN and inspect SQL statically**

Run: `npx vitest run src/types/preferences.test.ts`

Expected: PASS.

Run: `rg -n "ENABLE ROW LEVEL SECURITY|auth.uid|WITH CHECK|GRANT" supabase/migrations/006_profile_settings_and_reminders.sql`

Expected: both tables have RLS, ownership predicates, and explicit grants.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/006_profile_settings_and_reminders.sql src/types/preferences.ts src/types/preferences.test.ts
git commit -m "feat: add profile preferences schema"
```

### Task 2: Build the local cache and Supabase preferences repository

**Files:**
- Create: `src/lib/preferences/preferencesStorage.ts`
- Create: `src/lib/preferences/preferencesStorage.test.ts`
- Create: `src/services/preferencesService.ts`
- Create: `src/services/preferencesService.test.ts`

**Interfaces:**
- Produces: `loadCachedPreferences(scope)`, `saveCachedPreferences(scope, value)`, `fetchUserPreferences(userId)`, `upsertUserPreferences(userId, value)`.
- Consumes: `normalizeUserPreferences`, `assertAuthenticatedUser`, and `supabase`.

- [ ] **Step 1: Write failing cache migration tests**

Test that a guest scope loads defaults, valid cache is isolated by scope, malformed cache falls back safely, and legacy `thai-english-vocab-speech-settings` values migrate into `speechLocale` and `speechRate` once.

- [ ] **Step 2: Run cache tests and verify RED**

Run: `npx vitest run src/lib/preferences/preferencesStorage.test.ts`

Expected: FAIL because the storage module does not exist.

- [ ] **Step 3: Implement scoped cache storage**

```ts
export const PREFERENCES_CACHE_PREFIX = "mellow:user-preferences:v1"

export function getPreferencesCacheKey(scope: string): string {
  return `${PREFERENCES_CACHE_PREFIX}:${scope}`
}
```

Use `guest` and `user:<uuid>` scopes, normalize every load, and keep legacy speech data only as an input migration.

- [ ] **Step 4: Write failing repository mapping tests**

Mock only the Supabase boundary. Assert user ownership is checked, a missing row returns defaults, row fields map to camelCase, and upsert always forces the supplied `user_id`.

- [ ] **Step 5: Run repository tests and verify RED**

Run: `npx vitest run src/services/preferencesService.test.ts`

Expected: FAIL because the service does not exist.

- [ ] **Step 6: Implement the repository**

```ts
export async function upsertUserPreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<UserPreferences> {
  await assertAuthenticatedUser(userId)
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(preferencesToRow(userId, preferences), { onConflict: "user_id" })
    .select()
    .single()
  if (error) throw error
  return rowToPreferences(data)
}
```

- [ ] **Step 7: Verify GREEN and commit**

Run: `npx vitest run src/lib/preferences/preferencesStorage.test.ts src/services/preferencesService.test.ts`

Expected: PASS.

```bash
git add src/lib/preferences src/services/preferencesService.ts src/services/preferencesService.test.ts
git commit -m "feat: persist user preferences"
```

### Task 3: Add the global preferences, theme, and translation providers

**Files:**
- Create: `src/contexts/PreferencesContext.tsx`
- Create: `src/contexts/PreferencesContext.test.tsx`
- Create: `src/hooks/usePreferences.ts`
- Create: `src/i18n/translations.ts`
- Create: `src/contexts/I18nContext.tsx`
- Create: `src/contexts/I18nContext.test.tsx`
- Modify: `src/main.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `PreferencesProvider`, `usePreferences()`, `I18nProvider`, `useI18n()`, `t(key, values?)`.
- `usePreferences` returns `{ preferences, status, error, updatePreferences, retry }`.

- [ ] **Step 1: Write failing provider tests**

Cover guest cache loading without Supabase writes, authenticated cloud reconciliation, failed-save rollback, `data-theme` application, system-theme media changes, and `document.documentElement.lang` changes.

- [ ] **Step 2: Run provider tests and verify RED**

Run: `npx vitest run src/contexts/PreferencesContext.test.tsx src/contexts/I18nContext.test.tsx`

Expected: FAIL because the providers do not exist.

- [ ] **Step 3: Implement the preferences provider**

Load cache synchronously for first paint, reconcile after `useAuth` settles, serialize saves per user, and expose section-level errors. Do not write authenticated settings for a guest.

- [ ] **Step 4: Implement typed translations**

```ts
export const translations = {
  th: { "common.loading": "กำลังโหลด...", "profile.title": "โปรไฟล์" },
  en: { "common.loading": "Loading...", "profile.title": "Profile" },
} as const

export type TranslationKey = keyof typeof translations.th
```

Require equal keys in both catalogs and interpolate named values without HTML injection.

- [ ] **Step 5: Add semantic theme tokens**

Define light values on `:root` and dark overrides on `:root[data-theme="dark"]`. Replace body/card/ink/border token plumbing, preserve the current green brand, and add `color-scheme` without altering layout.

- [ ] **Step 6: Compose providers and verify GREEN**

```tsx
<PreferencesProvider>
  <I18nProvider>
    <App />
  </I18nProvider>
</PreferencesProvider>
```

Run: `npx vitest run src/contexts/PreferencesContext.test.tsx src/contexts/I18nContext.test.tsx src/App.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/contexts src/hooks/usePreferences.ts src/i18n src/main.tsx src/styles.css
git commit -m "feat: apply user language and theme preferences"
```

### Task 4: Extend the existing activity ledger with real practice time

**Files:**
- Modify: `src/lib/activity/activityTypes.ts`
- Modify: `src/lib/activity/activityNormalizer.ts`
- Modify: `src/lib/activity/activityNormalizer.test.ts`
- Modify: `src/lib/activity/activitySummary.ts`
- Modify: `src/lib/activity/activitySummary.test.ts`
- Create: `src/hooks/usePracticeTimeTracker.ts`
- Create: `src/hooks/usePracticeTimeTracker.test.tsx`

**Interfaces:**
- Produces: activity kind `practice_time`, metadata `durationSeconds`, `summarizeLearningActivity(..., goals)`, and `usePracticeTimeTracker({ mode, entityId, enabled })`.

- [ ] **Step 1: Write failing normalization and summary tests**

Add a valid `practice_time` event with `durationSeconds: 90`; reject zero, negative, non-finite, and over-cap values. Assert action counts ignore it while daily minutes include it and use preference targets.

- [ ] **Step 2: Run activity tests and verify RED**

Run: `npx vitest run src/lib/activity/activityNormalizer.test.ts src/lib/activity/activitySummary.test.ts`

Expected: FAIL because timed activity is not supported.

- [ ] **Step 3: Implement timed metadata and goal inputs**

```ts
export type LearningActivityMetadata = {
  correct?: boolean
  wasDue?: boolean
  sessionId?: string
  durationSeconds?: number
}
```

Add goal inputs `{ dailyVocabularyGoal, dailyPracticeMinutes }`, keep existing mission targets, and add `practiceTime` progress without counting timed events as learning actions.

- [ ] **Step 4: Write failing active-timer hook tests**

Use fake timers. Assert visible active seconds flush into `recordLearningActivity`, hidden-tab time is excluded, activity resumes after interaction, and cleanup writes at most one final segment.

- [ ] **Step 5: Run hook tests and verify RED**

Run: `npx vitest run src/hooks/usePracticeTimeTracker.test.tsx`

Expected: FAIL because the hook does not exist.

- [ ] **Step 6: Implement the timer**

Use `visibilitychange`, pointer/keyboard activity, a five-minute idle cutoff, 30-second flush intervals, and synchronous local ledger writes. Cap a single segment at 30 minutes and generate deterministic session-scoped entity IDs.

- [ ] **Step 7: Verify GREEN and commit**

Run: `npx vitest run src/lib/activity src/hooks/usePracticeTimeTracker.test.tsx`

Expected: PASS.

```bash
git add src/lib/activity src/hooks/usePracticeTimeTracker.ts src/hooks/usePracticeTimeTracker.test.tsx
git commit -m "feat: track active learning time"
```

### Task 5: Wire time tracking into the four real learning modes

**Files:**
- Modify: `src/pages/FlashcardPage.tsx`
- Modify: `src/pages/QuizPage.tsx`
- Modify: `src/pages/GrammarLessonPage.tsx`
- Modify: `src/pages/SpeakModePage.tsx`
- Test: existing page tests plus new timer assertions in their activity tests.

**Interfaces:**
- Consumes: `usePracticeTimeTracker`.
- Produces: correctly scoped `practice_time` events for `flashcard`, `quiz`, `grammar`, and `speak` only while a practice view is active.

- [ ] **Step 1: Add failing page-level timer assertions**

Mock the timer hook and assert each page passes the correct mode and disables timing on setup/list-only states.

- [ ] **Step 2: Run targeted tests and verify RED**

Run: `npx vitest run src/pages/FlashcardPage.test.tsx src/pages/QuizPage.test.tsx src/pages/GrammarLessonPage.test.tsx src/pages/SpeakModePage.activity.test.tsx`

Expected: FAIL because pages do not mount the timer.

- [ ] **Step 3: Mount the hook at practice boundaries**

Use stable entity IDs such as the flashcard session ID, quiz session ID, grammar topic ID, and selected Speak conversation/category. Never call the hook conditionally; pass `enabled`.

- [ ] **Step 4: Verify GREEN and commit**

Run the same targeted command and expect PASS.

```bash
git add src/pages/FlashcardPage.tsx src/pages/QuizPage.tsx src/pages/GrammarLessonPage.tsx src/pages/SpeakModePage.tsx src/pages/*test.tsx
git commit -m "feat: record practice time across learning modes"
```

### Task 6: Build the seven-day per-mode summary and chart

**Files:**
- Create: `src/lib/activity/weeklyActivitySummary.ts`
- Create: `src/lib/activity/weeklyActivitySummary.test.ts`
- Create: `src/components/profile/WeeklyActivityChart.tsx`
- Create: `src/components/profile/WeeklyActivityChart.test.tsx`
- Modify: `src/pages/ProfilePage.tsx`
- Modify: `src/pages/ProfilePage.test.tsx`

**Interfaces:**
- Produces: `summarizeWeeklyActivity(events, now)` returning seven oldest-to-newest `DailyActivitySummary` values.
- Chart props: `{ days, language, selectedDate, onSelectDate }`.

- [ ] **Step 1: Write failing summary tests**

Cover month/year boundaries, local dates, future-event exclusion, per-mode counts, `practice_time` seconds, and exactly seven ordered days including zero-activity days.

- [ ] **Step 2: Run summary tests and verify RED**

Run: `npx vitest run src/lib/activity/weeklyActivitySummary.test.ts`

Expected: FAIL because the summary module does not exist.

- [ ] **Step 3: Implement the pure summary**

Use existing `toLocalDateKey` and `addLocalCalendarDays`; never parse date-only strings as UTC.

- [ ] **Step 4: Write failing chart interaction tests**

Assert seven accessible buttons, localized labels, real totals, selected-day mode details, practiced minutes, keyboard focus, and the existing empty-state copy.

- [ ] **Step 5: Run chart tests and verify RED**

Run: `npx vitest run src/components/profile/WeeklyActivityChart.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 6: Implement the chart and compose Profile**

Preserve the current bar geometry and green-today treatment. Add a flat detail row beneath the bars rather than a nested card. Remove duplicate `calculateWeeklyActivity` and streak logic from `ProfilePage`; use shared summaries.

- [ ] **Step 7: Verify GREEN and commit**

Run: `npx vitest run src/lib/activity/weeklyActivitySummary.test.ts src/components/profile/WeeklyActivityChart.test.tsx src/pages/ProfilePage.test.tsx`

Expected: PASS.

```bash
git add src/lib/activity/weeklyActivitySummary* src/components/profile/WeeklyActivityChart* src/pages/ProfilePage*
git commit -m "feat: show real weekly profile activity"
```

### Task 7: Make learning goals, language, theme, and speech settings functional

**Files:**
- Create: `src/components/profile/ProfileSettings.tsx`
- Create: `src/components/profile/ProfileSettings.test.tsx`
- Modify: `src/pages/ProfilePage.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/HomePage.test.tsx`
- Modify: `src/lib/speechSettings.ts`
- Modify: `src/lib/speechSettings.test.ts`
- Modify: `src/utils/speech.ts`
- Modify: `src/utils/speech.test.ts`
- Modify: `src/components/ui/SpeakButton.tsx`
- Modify: `src/components/ui/SpeakButton.test.tsx`
- Modify: `src/components/settings/SpeechSettings.tsx`
- Modify: `src/components/settings/SpeechSettings.test.tsx`

**Interfaces:**
- `ProfileSettings` consumes `usePreferences` and exposes inline disclosure sections.
- Speech uses `{ speechLocale, speechVoiceUri, speechRate, speechAutoPlay }` from canonical preferences.

- [ ] **Step 1: Write failing settings disclosure tests**

Assert one disclosure is open at a time, numeric goal validation, save loading/error/success states, language and theme immediate effects, voice option rendering from `speechSynthesis.getVoices()`, and Auto Play persistence.

- [ ] **Step 2: Run component tests and verify RED**

Run: `npx vitest run src/components/profile/ProfileSettings.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the settings component**

Use standard buttons, labels, inputs, selects, radio groups, and switches with the existing `rounded-xl`, border, focus-ring, and green-primary vocabulary. Keep sections inline and provide `aria-expanded` and `aria-controls`.

- [ ] **Step 4: Write failing Home goal tests**

Assert Home passes saved vocabulary and time targets into the shared summary and renders both progress values without changing review/flashcard/speak mission logic.

- [ ] **Step 5: Implement preference-backed goals**

Replace the hard-coded daily goal only where the preference applies. Vocabulary goal counts Flashcard and Quiz answers; time goal uses timed events. Keep existing mission constants unchanged.

- [ ] **Step 6: Write failing speech compatibility tests**

Assert legacy local speech data migrates, `SpeakButton` selects `voiceURI` when available, falls back by locale, uses the saved rate, and Auto Play has a StrictMode-safe deduplication guard.

- [ ] **Step 7: Implement speech integration and verify GREEN**

Run: `npx vitest run src/components/profile/ProfileSettings.test.tsx src/pages/HomePage.test.tsx src/lib/speechSettings.test.ts src/utils/speech.test.ts src/components/ui/SpeakButton.test.tsx src/components/settings/SpeechSettings.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/profile/ProfileSettings* src/pages/ProfilePage.tsx src/pages/HomePage* src/lib/speechSettings* src/utils/speech* src/components/ui/SpeakButton* src/components/settings/SpeechSettings*
git commit -m "feat: apply profile learning and speech settings"
```

### Task 8: Apply Thai and English UI language across current routes

**Files:**
- Modify: `src/i18n/translations.ts`
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/MobileHeader.tsx`
- Modify: `src/components/layout/MobileNav.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/ProfilePage.tsx`
- Modify: `src/pages/VocabularyPage.tsx`
- Modify: `src/pages/WordDetailPage.tsx`
- Modify: `src/pages/FlashcardPage.tsx`
- Modify: `src/pages/QuizPage.tsx`
- Modify: `src/pages/SpeakModePage.tsx`
- Modify: `src/pages/GrammarLessonPage.tsx`
- Modify: `src/pages/AuthPage.tsx`
- Modify relevant rendered child components containing UI chrome.
- Test: existing page/layout tests plus `src/i18n/translations.test.ts`.

**Interfaces:**
- Consumes: `useI18n()`.
- Produces: translated UI chrome with unchanged learning dataset content.

- [ ] **Step 1: Add a failing catalog parity test**

Assert Thai and English have identical keys and all values are non-empty strings/functions.

- [ ] **Step 2: Run the parity test and verify RED**

Run: `npx vitest run src/i18n/translations.test.ts`

Expected: FAIL until the complete catalog exists.

- [ ] **Step 3: Inventory and add translation keys**

Run: `rg -n -g '*.tsx' '>[[:space:]]*[^<{[:space:]][^<{]*<' src/components src/pages`

Add keys for navigation, headings, actions, labels, validation, loading, errors, and empty states. Keep vocabulary words, definitions, example sentences, grammar lesson content, and conversation content in their existing bilingual data model.

- [ ] **Step 4: Convert one route group at a time**

Convert layout/Auth, then Home/Profile, then Vocabulary/Word Detail, then Flashcard/Quiz, then Speak/Grammar. After each group run its existing tests and add one English-mode assertion.

- [ ] **Step 5: Verify all route groups GREEN**

Run: `npx vitest run src/App*.test.tsx src/components/layout src/pages`

Expected: PASS with Thai default and English-mode assertions.

- [ ] **Step 6: Commit**

```bash
git add src/i18n src/components src/pages
git commit -m "feat: support Thai and English interface language"
```

### Task 9: Harden personal data, password security, and logout

**Files:**
- Modify: `src/services/profileService.ts`
- Modify: `src/services/profileService.test.ts`
- Modify: `src/services/authService.ts`
- Create: `src/services/authService.profileSettings.test.ts`
- Modify: `src/pages/ProfilePage.tsx`
- Modify: `src/pages/ProfilePage.test.tsx`

**Interfaces:**
- Produces: `replaceAvatar(file, userId, previousUrl)`, `updatePassword(password)`, existing `resetPasswordForEmail(email)`, and `logout()` with visible result handling.

- [ ] **Step 1: Write failing avatar transaction tests**

Assert a new avatar is validated and uploaded, the profile row updates, the previous owned object is removed only after a successful row update, and a failed row update removes the newly uploaded orphan.

- [ ] **Step 2: Run avatar tests and verify RED**

Run: `npx vitest run src/services/profileService.test.ts`

Expected: FAIL because replacement is not atomic at the service boundary.

- [ ] **Step 3: Implement safe replacement and explicit profile update columns**

Keep the existing 5 MB JPG/PNG/WebP rules and ownership path checks. Ensure the migration grants `UPDATE(display_name, avatar_url)` on `profiles`.

- [ ] **Step 4: Write failing Auth service tests**

Assert `updatePassword` calls `supabase.auth.updateUser({ password })`, reset uses the current email and correct hash redirect, logout reports failure, and no password is stored locally.

- [ ] **Step 5: Implement security actions and UI states**

Use minimum password validation consistent with registration, confirmation matching, success feedback, and reset-email rate-limit translation. Preserve the existing Auth state change routing.

- [ ] **Step 6: Verify GREEN and commit**

Run: `npx vitest run src/services/profileService.test.ts src/services/authService.profileSettings.test.ts src/pages/ProfilePage.test.tsx`

Expected: PASS.

```bash
git add src/services/profileService* src/services/authService* src/pages/ProfilePage*
git commit -m "feat: complete profile and account security actions"
```

### Task 10: Add real Web Push subscription management

**Files:**
- Create: `public/mellow-sw.js`
- Create: `src/lib/notifications/pushNotifications.ts`
- Create: `src/lib/notifications/pushNotifications.test.ts`
- Create: `src/services/pushSubscriptionService.ts`
- Create: `src/services/pushSubscriptionService.test.ts`
- Modify: `src/components/profile/ProfileSettings.tsx`
- Modify: `src/components/profile/ProfileSettings.test.tsx`

**Interfaces:**
- Produces: `getPushCapability()`, `enablePushNotifications(userId)`, `disablePushNotifications(userId)`, `upsertPushSubscription`, `deletePushSubscription`.

- [ ] **Step 1: Write failing capability and serialization tests**

Cover unsupported browser, missing public key, default/denied/granted permission, base64 VAPID conversion, Service Worker registration, subscription serialization, and browser unsubscribe.

- [ ] **Step 2: Run notification tests and verify RED**

Run: `npx vitest run src/lib/notifications/pushNotifications.test.ts src/services/pushSubscriptionService.test.ts`

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement Service Worker and client flow**

```js
self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {}
  event.waitUntil(self.registration.showNotification(payload.title ?? "Mellow", {
    body: payload.body,
    icon: "/logo.png",
    data: { url: payload.url ?? "/#" },
  }))
})
```

The notification click handler focuses an existing Mellow client or opens the stored URL. Do not expose private VAPID or service-role secrets.

- [ ] **Step 4: Implement the Supabase subscription repository**

Force `user_id` from the authenticated argument, use endpoint as conflict identity, and delete only owned endpoints.

- [ ] **Step 5: Connect the reminder settings disclosure**

Enable only after permission and subscription persistence succeed. On disable, remove both remote and browser subscription. Show unsupported, blocked, configuration, and retry states distinctly.

- [ ] **Step 6: Verify GREEN and commit**

Run: `npx vitest run src/lib/notifications src/services/pushSubscriptionService.test.ts src/components/profile/ProfileSettings.test.tsx`

Expected: PASS.

```bash
git add public/mellow-sw.js src/lib/notifications src/services/pushSubscriptionService* src/components/profile/ProfileSettings*
git commit -m "feat: manage profile push reminders"
```

### Task 11: Implement the scheduled Supabase reminder sender

**Files:**
- Create: `supabase/functions/send-learning-reminders/index.ts`
- Create: `supabase/functions/send-learning-reminders/index.test.ts`
- Create: `docs/SUPABASE_PROFILE_SETTINGS_SETUP.md`

**Interfaces:**
- HTTP request requires `Authorization: Bearer <REMINDER_CRON_SECRET>`.
- Produces JSON `{ checked, sent, expired, failed }`.

- [ ] **Step 1: Extract and test due-reminder logic first**

Test Thai and English payloads, IANA timezone conversion, exact configured minute, disabled users, already-notified date, expired subscriptions, and partial provider failures.

- [ ] **Step 2: Run Edge Function tests and verify RED**

Run: `npx vitest run supabase/functions/send-learning-reminders/index.test.ts`

Expected: FAIL because the function does not exist.

- [ ] **Step 3: Implement the Edge Function**

Read `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, VAPID secrets, and `REMINDER_CRON_SECRET` from `Deno.env`. Reject missing/incorrect cron authorization before database access. Query enabled preferences and subscriptions, send Web Push, delete 404/410 endpoints, and update `last_notified_local_date` only after success.

- [ ] **Step 4: Write exact activation instructions**

Document:

```bash
supabase migration list
supabase db push
supabase functions deploy send-learning-reminders
supabase secrets set WEB_PUSH_PUBLIC_KEY=... WEB_PUSH_PRIVATE_KEY=... WEB_PUSH_SUBJECT=mailto:... REMINDER_CRON_SECRET=...
```

Also document `VITE_WEB_PUSH_PUBLIC_KEY`, Dashboard Cron every minute, authenticated smoke SQL, RLS cross-user denial, and rollback instructions that disable Cron before removing subscriptions.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npx vitest run supabase/functions/send-learning-reminders/index.test.ts`

Expected: PASS.

```bash
git add supabase/functions docs/SUPABASE_PROFILE_SETTINGS_SETUP.md
git commit -m "feat: send scheduled learning reminders"
```

### Task 12: Full regression, browser verification, and delivery report

**Files:**
- Modify only files required by failures found during verification.

**Interfaces:**
- Produces: verified application and an exact hosted-Supabase activation handoff.

- [ ] **Step 1: Run formatting and whitespace checks**

Run: `git diff --check`

Expected: exit 0.

- [ ] **Step 2: Run the full lint scan**

Run: `npx eslint src api --max-warnings=0`

Expected: exit 0 with no warnings.

- [ ] **Step 3: Run TypeScript and production build**

Run: `npm run build`

Expected: `tsc -b` and `vite build` exit 0. Record any existing chunk-size warning separately; do not call it a failure if exit is 0.

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run --reporter=verbose --maxWorkers=1`

Expected: all non-skipped tests pass. Report exact file/test counts and intentional skips.

- [ ] **Step 5: Browser smoke test desktop and mobile**

Start: `npm run dev -- --host 127.0.0.1`

Verify Home, Profile, Vocabulary, Flashcard, Quiz, Speak, Grammar, Auth, and back navigation. On Profile verify seven dates, mode detail selection, goal validation, Thai/English, Light/Dark/System, speech voice/rate, avatar controls, password reset, logout failure/success handling, and all Push capability states available in the browser.

- [ ] **Step 6: Verify hosted Supabase when credentials are available**

Apply migration, deploy the function, configure secrets/Cron, then use two test users to prove preference and subscription RLS isolation. Trigger one due reminder and confirm one notification plus `last_notified_local_date`. If hosted access is unavailable, report this as not activated rather than claiming runtime verification.

- [ ] **Step 7: Remove generated build artifacts and review scope**

Remove untracked `dist` created by verification, run `git status --short`, and ensure `skills-lock.json` remains outside feature commits unless the user explicitly requests it.

- [ ] **Step 8: Final commit for verification-only fixes**

```bash
git add <only-files-changed-by-verification>
git commit -m "test: verify profile settings integration"
```

Skip this commit when verification produces no code changes.
