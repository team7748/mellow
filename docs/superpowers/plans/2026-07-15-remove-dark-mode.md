# Remove Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the appearance menu and all Dark/System runtime behavior so Mellow always uses its existing Light theme.

**Architecture:** Theme is removed from the frontend preference contract, repository mapping, provider effects, Profile UI, and CSS. The existing Supabase `theme` column remains untouched for backward database compatibility, while frontend selects and upserts omit it.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, Supabase JS

## Global Constraints

- Keep the existing `public.user_preferences.theme` database column and migration definition.
- Preserve every non-theme Profile setting and the current Light layout.
- Do not add a destructive migration.
- Do not modify or commit unrelated `skills-lock.json` or user-owned changes.

---

### Task 1: Remove theme from the frontend preference contract

**Files:**
- Modify: `src/types/preferences.ts`
- Modify: `src/types/preferences.test.ts`
- Modify: `src/services/preferencesService.ts`
- Modify: `src/services/preferencesService.test.ts`
- Modify: `src/lib/preferences/preferencesStorage.test.ts`

**Interfaces:**
- Produces: `UserPreferences` and `UserPreferencesRow` without a `theme` field.
- Preserves: the database column by omitting it from client row mapping and upserts.

- [ ] **Step 1: Update tests to define the frontend contract without theme**

Remove `theme` expectations from valid preference fixtures and assert repository upserts do not contain a theme property:

```ts
expect(preferencesToRow("user-2", preferences)).not.toHaveProperty("theme")
expect(mocks.upsert).toHaveBeenCalledWith(
  expect.not.objectContaining({ theme: expect.anything() }),
  { onConflict: "user_id" },
)
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npx vitest run src/types/preferences.test.ts src/services/preferencesService.test.ts src/lib/preferences/preferencesStorage.test.ts
```

Expected: FAIL because the application model and repository still expose `theme`.

- [ ] **Step 3: Remove theme from application types and row mapping**

Delete `AppTheme`, `UserPreferences.theme`, `UserPreferencesRow.theme`, the default value, validation branch, normalized result, and both repository mappings. Keep the SQL migration unchanged.

The row conversion must end as:

```ts
return {
  user_id: userId,
  daily_vocabulary_goal: normalized.dailyVocabularyGoal,
  daily_practice_minutes: normalized.dailyPracticeMinutes,
  reminder_enabled: normalized.reminderEnabled,
  reminder_time: normalized.reminderTime,
  timezone: normalized.timezone,
  language: normalized.language,
  speech_locale: normalized.speechLocale,
  speech_voice_uri: normalized.speechVoiceUri,
  speech_rate: normalized.speechRate,
  speech_auto_play: normalized.speechAutoPlay,
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the command from Step 2. Expected: all selected tests pass.

- [ ] **Step 5: Commit the contract removal**

```bash
git add src/types/preferences* src/services/preferencesService* src/lib/preferences/preferencesStorage.test.ts
git commit -m "refactor: remove theme preference from frontend"
```

### Task 2: Remove theme UI and runtime behavior

**Files:**
- Modify: `src/components/profile/ProfileSettings.tsx`
- Modify: `src/components/profile/ProfileSettings.test.tsx`
- Modify: `src/contexts/PreferencesContext.tsx`
- Modify: `src/contexts/PreferencesContext.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: theme-free `UserPreferences` from Task 1.
- Produces: Light-only document rendering with no appearance selector.

- [ ] **Step 1: Write failing Light-only UI and provider tests**

Add assertions:

```ts
expect(screen.queryByLabelText("ธีมการแสดงผล")).not.toBeInTheDocument()
expect(document.documentElement.dataset.theme).toBeUndefined()
expect(document.documentElement.style.colorScheme).toBe("light")
```

Remove test actions that select `dark` or expect a theme update.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
npx vitest run src/components/profile/ProfileSettings.test.tsx src/contexts/PreferencesContext.test.tsx
```

Expected: FAIL because the selector and runtime dark-theme effect still exist.

- [ ] **Step 3: Remove the selector and theme effect**

Delete `AppTheme` imports and the theme `<select>` from `ProfileSettings`. Keep the language selector and allow it to span the available settings width.

Replace the provider theme effect with a Light-only invariant:

```ts
useEffect(() => {
  delete document.documentElement.dataset.theme
  document.documentElement.style.colorScheme = "light"
}, [])
```

Delete the complete `:root[data-theme="dark"]` block from `src/styles.css`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the command from Step 2. Expected: all selected tests pass.

- [ ] **Step 5: Commit Light-only runtime behavior**

```bash
git add src/components/profile/ProfileSettings* src/contexts/PreferencesContext* src/styles.css
git commit -m "feat: enforce light mode"
```

### Task 3: Update documentation and verify the full application

**Files:**
- Modify: `docs/SUPABASE_PROFILE_SETTINGS_SETUP.md`
- Modify: `docs/superpowers/specs/2026-07-15-profile-activity-settings-design.md`

**Interfaces:**
- Documents: retained database compatibility column and Light-only frontend behavior.

- [ ] **Step 1: Update active documentation**

Document that `theme` is retained only as a compatibility column and is ignored by the frontend. Replace the old Light/Dark/System behavior statement with:

```md
Mellow uses Light mode only. The legacy `user_preferences.theme` column remains in Supabase for schema compatibility but is not read or written by the frontend.
```

- [ ] **Step 2: Verify no active frontend theme references remain**

```bash
rg -n "AppTheme|preferences\.theme|data-theme|ธีมการแสดงผล|value=\"dark\"|value=\"system\"" src
```

Expected: no matches outside tests that explicitly assert absence.

- [ ] **Step 3: Run complete verification**

```bash
npm run build
npx tsc -b --pretty false
npm run lint
npx vitest run --maxWorkers=1 --no-file-parallelism
```

Expected: Build, TypeScript, lint, and all non-skipped tests pass.

- [ ] **Step 4: Commit documentation**

```bash
git add docs/SUPABASE_PROFILE_SETTINGS_SETUP.md docs/superpowers/specs/2026-07-15-profile-activity-settings-design.md
git commit -m "docs: document light-only appearance"
```
