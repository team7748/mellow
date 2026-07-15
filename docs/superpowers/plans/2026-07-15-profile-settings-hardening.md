# Profile Settings Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit the recently added Profile, Preferences, activity-summary, push-reminder, and Light-mode functions and fix every reproducible correctness or security defect found in that scope.

**Architecture:** Preserve the existing React context, Learning Activity ledger, Supabase tables, RLS policies, and UI. Fix concurrency at the Preferences provider boundary, fail closed at the Edge Function environment boundary, clean device subscriptions during logout, make avatar storage/database transitions compensating, and keep chart selection valid when its seven-day window changes.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Tailwind CSS, Supabase JS, Supabase Edge Functions (Deno), Web Push.

## Global Constraints

- Keep the current UI layout and Light-only behavior.
- Do not create a second activity or preferences system.
- Do not weaken Supabase Auth or RLS.
- Keep the legacy `user_preferences.theme` column unchanged.
- Do not expose secrets or provider/database error details.
- Preserve unrelated working-tree changes and `skills-lock.json`.

---

### Task 1: Fail-closed reminder environment

**Files:**
- Modify: `supabase/functions/send-learning-reminders/reminderLogic.ts`
- Modify: `supabase/functions/send-learning-reminders/index.ts`
- Test: `supabase/functions/send-learning-reminders/index.test.ts`

**Interfaces:**
- Produces: `readReminderEnvironment(getEnv)` returning either validated environment values or the missing variable names.
- Consumes: `Deno.env.get` in the deployed Edge Function.

- [ ] Add tests proving missing cron/VAPID values never receive fallback credentials.
- [ ] Run the focused test and confirm RED.
- [ ] Remove hard-coded fallbacks, return 500 for missing server configuration, and keep database errors private.
- [ ] Run the focused test and confirm GREEN.

### Task 2: Serialize preferences and isolate auth scopes

**Files:**
- Modify: `src/contexts/PreferencesContext.tsx`
- Test: `src/contexts/PreferencesContext.test.tsx`

**Interfaces:**
- Consumes: `upsertUserPreferences(userId, preferences)`.
- Produces: `updatePreferences(updates)` that preserves rapid updates, writes them in order, and ignores completions from a stale user scope.

- [ ] Add tests for two rapid updates with deferred saves and for logout while a save is pending.
- [ ] Run the focused test and confirm RED.
- [ ] Add synchronous preference refs, a serialized save queue, revision checks, and scope checks.
- [ ] Run the focused test and confirm GREEN.

### Task 3: Remove this device's push subscription during logout

**Files:**
- Modify: `src/lib/notifications/pushNotifications.ts`
- Modify: `src/components/profile/AccountSecurity.tsx`
- Modify: `src/pages/ProfilePage.tsx`
- Test: `src/lib/notifications/pushNotifications.test.ts`
- Test: `src/components/profile/AccountSecurity.test.tsx`

**Interfaces:**
- Produces: `disablePushNotifications(userId)` that attempts both local unsubscribe and authenticated database deletion.
- Consumes: authenticated `userId` passed from Profile Page to Account Security.

- [ ] Add tests proving logout cleans the device subscription before Supabase sign-out and that cleanup failure does not block sign-out.
- [ ] Add tests proving both cleanup operations are attempted even when one fails.
- [ ] Run focused tests and confirm RED.
- [ ] Implement best-effort cleanup and keep logout error handling intact.
- [ ] Run focused tests and confirm GREEN.

### Task 4: Make avatar transitions compensating

**Files:**
- Modify: `src/pages/ProfilePage.tsx`
- Test: `src/pages/ProfilePage.test.tsx`

**Interfaces:**
- Consumes: `uploadAvatar`, `updateProfile`, and `deleteAvatar`.
- Produces: replacement flow that deletes the old file only after the database points to the new file, and removes a new upload if the database update fails.

- [ ] Add tests for successful replacement, failed database update, and avatar deletion ordering.
- [ ] Run the focused test and confirm RED.
- [ ] Implement compensating cleanup and database-first removal.
- [ ] Run the focused test and confirm GREEN.

### Task 5: Verify weekly-chart selection

**Files:**
- Modify: `src/components/profile/WeeklyActivityChart.tsx`
- Test: `src/components/profile/WeeklyActivityChart.test.tsx`

**Interfaces:**
- Consumes: rolling `DailyActivitySummary[]` data.
- Produces: evidence that the existing fallback keeps selection in the rendered seven-day window.

- [x] Probe a shifted seven-day window.
- [x] Confirm the existing `selectedDay` fallback already selects the newest available day.
- [x] Make no production change because the suspected defect is not reproducible.

### Task 6: Full verification and security handoff

**Files:**
- Modify: `docs/SUPABASE_PROFILE_SETTINGS_SETUP.md`

- [ ] Document that all reminder credentials must be Supabase secrets with no source fallback.
- [ ] Scan source for hard-coded secret patterns and stale Dark/System runtime references.
- [ ] Run `npm run build`.
- [ ] Run `npm run lint` and ESLint on every changed source/test file.
- [ ] Run the full Vitest suite serially.
- [ ] Report credential rotation as required because previously embedded values must be treated as compromised.
