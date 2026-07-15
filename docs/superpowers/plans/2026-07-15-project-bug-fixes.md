# Project Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a clean build, passing tests and lint, secure avatar handling, and working accessible interactions without reverting the current Tailwind/Profile UI work.

**Architecture:** Preserve the present components and data flow, repairing contracts at their source: semantic props at component boundaries, synchronous Speak progress before activity recording, typed derived profile statistics, and authenticated Supabase Storage ownership policies. Existing regression tests are the primary contract; new tests cover avatar validation, Storage calls, and untested error states.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, ESLint, Tailwind CSS 4, Supabase JS/Postgres Storage RLS.

## Global Constraints

- Preserve the current Tailwind layout, colors, sizing, and Profile redesign unless correctness or accessibility requires a change.
- Preserve all user-owned uncommitted changes and never stage unrelated files.
- Use the existing activity layer's active-user fallback instead of adding a duplicate auth subscription to `SpeakModePage`.
- Accept avatar MIME types `image/jpeg`, `image/png`, and `image/webp`, with a maximum size of 5 MiB.
- Use a public avatar bucket for public profile images, but authorize mutations by authenticated user folder and object owner.
- Do not disable lint rules to make verification pass.

---

### Task 1: Restore Home, Flashcard, and Vocabulary contracts

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/components/flashcard/FlashcardSetup.tsx`
- Modify: `src/components/vocabulary/VocabularyCard.tsx`
- Test: `src/pages/HomePage.test.tsx`
- Test: `src/pages/FlashcardPage.test.tsx`
- Test: `src/pages/VocabularyPage.test.tsx`

**Interfaces:**
- Consumes: existing `Card`, `OptionCard`, `VocabularyItem`, and navigation callbacks.
- Produces: an accessible Home statistics region, radio-style training options, and a string category label.

- [ ] **Step 1: Re-run the existing regression tests and confirm RED**

Run:

```powershell
npx vitest run src/pages/HomePage.test.tsx src/pages/FlashcardPage.test.tsx src/pages/VocabularyPage.test.tsx --maxWorkers=1
```

Expected: failures mention missing `Learning statistics` region, missing `ฝึกพูด`, missing `radio`, and missing `School & Work`.

- [ ] **Step 2: Restore the minimal semantic and display contracts**

Apply these exact behaviors:

```tsx
<Card role="region" aria-label="Learning statistics" ... />

<MissionItem title="ฝึกพูด" ... />

<OptionCard
  role="radio"
  aria-checked={mode === m.value}
  aria-label={m.value === "reviewForgot"
    ? `${m.label} ${m.labelThai} ฝึกเฉพาะคำที่จำไม่ได้`
    : undefined}
  selected={mode === m.value}
  ...
/>
```

Restore the vocabulary derivation:

```ts
const scenarioLabel = categories.length > 0
  ? categories[0]
  : (vocabulary.scenarioThai || vocabulary.sourceScenario)
```

- [ ] **Step 3: Verify GREEN for the three regressions**

Run the Step 1 command. Expected: all tests in those files pass.

- [ ] **Step 4: Review the focused diff**

Run:

```powershell
git diff -- src/pages/HomePage.tsx src/components/flashcard/FlashcardSetup.tsx src/components/vocabulary/VocabularyCard.tsx
```

Expected: only the repaired contracts plus pre-existing user changes.

---

### Task 2: Make Speak completion ordered and idempotent

**Files:**
- Modify: `src/pages/SpeakModePage.tsx`
- Test: `src/pages/SpeakModePage.activity.test.tsx`

**Interfaces:**
- Consumes: `progressRef`, `saveSpeakModeProgress`, `recordLearningActivity`, `getActivityIdentityScope()`, and `getConversationCompletionEventId(...)`.
- Produces: `recordConversationCompletion(conversationId): void`, which persists first, records once, and propagates persistence failures.

- [ ] **Step 1: Confirm the existing Speak activity test is RED for the correct reason**

Run:

```powershell
npx vitest run src/pages/SpeakModePage.activity.test.tsx --maxWorkers=1
```

Expected: five failures and an unhandled `ReferenceError: user is not defined`.

- [ ] **Step 2: Restore synchronous first-completion ordering**

Remove the unused `useAuth` import and implement the completion core as:

```ts
const currentProgress = progressRef.current
if (!currentProgress.completedConversations.includes(conversationId)) {
  const newProgress = {
    ...currentProgress,
    completedConversations: [
      ...currentProgress.completedConversations,
      conversationId,
    ],
  }
  saveSpeakModeProgress(newProgress)
  progressRef.current = newProgress
  setProgress(newProgress)

  const localDate = toLocalDateKey(new Date())
  const scope = getActivityIdentityScope()
  recordLearningActivity(
    { kind: "conversation_completed", mode: "speak", entityId: conversationId },
    { eventId: getConversationCompletionEventId(scope, conversationId, localDate) },
  )
}
```

Remove duplicate `onReachedLastLine` recording. Keep completion navigation after this synchronous call.

- [ ] **Step 3: Verify GREEN and absence of unhandled errors**

Run the Step 1 command. Expected: 5/5 pass and no unhandled errors.

---

### Task 3: Stabilize Speak player keyboard and hook behavior

**Files:**
- Modify: `src/components/speak/ConversationPlayer.tsx`
- Modify: `src/components/speak/InteractivePracticePlayer.tsx`
- Modify: `src/components/speak/InteractivePracticePlayer.test.tsx`

**Interfaces:**
- Consumes: existing `onComplete`, speech utilities, question arrays, and keyboard events.
- Produces: dependency-safe `handleNext`/`handlePrevious` callbacks and cleaned event listeners.

- [ ] **Step 1: Record current lint RED**

Run:

```powershell
npx eslint src/components/speak/ConversationPlayer.tsx src/components/speak/InteractivePracticePlayer.tsx --max-warnings=0
```

Expected: unused catch variables, missing dependencies, and callbacks accessed before declaration.

- [ ] **Step 2: Add keyboard regression coverage before implementation**

Extend `InteractivePracticePlayer.test.tsx` with a test that renders two questions, dispatches `ArrowRight` and `ArrowLeft` on `window`, verifies the question counter changes, and dispatches `ArrowRight` on the last question to verify `onComplete` once. Run it before implementation as a behavior guard; the ESLint failure from Step 1 is the RED gate for the hook-order defect.

- [ ] **Step 3: Implement stable callback ordering**

Declare `handleNext` and `handlePrevious` with `useCallback` before the keyboard effect:

```ts
const handleNext = useCallback(() => {
  if (currentIndex < questions.length - 1) {
    setCurrentIndex((previous) => previous + 1)
  } else {
    onComplete?.()
  }
}, [currentIndex, onComplete, questions.length])

const handlePrevious = useCallback(() => {
  if (currentIndex > 0) setCurrentIndex((previous) => previous - 1)
}, [currentIndex])
```

Make keyboard effects depend on the callbacks, current question, and speed. Use optional catch binding (`catch {}`) where the error is intentionally ignored. Remove `onExit` from the prop interface if `rg "onExit=" src` confirms no caller and no UI control consumes it.

- [ ] **Step 4: Verify tests and lint GREEN**

Run:

```powershell
npx vitest run src/components/speak/InteractivePracticePlayer.test.tsx --maxWorkers=1
npx eslint src/components/speak/ConversationPlayer.tsx src/components/speak/InteractivePracticePlayer.tsx --max-warnings=0
```

Expected: tests pass and ESLint reports no problems.

---

### Task 4: Harden Profile statistics and avatar upload

**Files:**
- Modify: `src/pages/ProfilePage.tsx`
- Modify: `src/services/profileService.ts`
- Modify: `src/types/profile.ts`
- Create: `src/pages/ProfilePage.test.tsx`
- Create: `src/services/profileService.test.ts`
- Modify: `supabase/migrations/005_user_avatars.sql`

**Interfaces:**
- Consumes: `LearningActivityEvent[]`, authenticated user ID, Supabase Storage `.upload()` and `.getPublicUrl()`, and `updateProfile`.
- Produces: validated avatar uploads returning `string | null`, accessible upload feedback, and ownership-safe Storage policies.

- [ ] **Step 1: Write failing service and page tests**

Service tests must assert:

```ts
expect(assertAuthenticatedUser).toHaveBeenCalledWith(userId)
expect(upload).toHaveBeenCalledWith(
  expect.stringMatching(new RegExp(`^${userId}/[a-f0-9-]+\\.png$`)),
  file,
  { cacheControl: "3600", contentType: "image/png", upsert: false },
)
```

They also assert `null` on upload error and no public URL lookup after failure.

Page tests must assert that an unsupported MIME type and a file larger than 5 MiB do not call `uploadAvatar`, show a Thai `role="alert"`, a failed upload retains the previous avatar, and a successful upload updates the profile.

- [ ] **Step 2: Verify the new tests are RED**

Run:

```powershell
npx vitest run src/pages/ProfilePage.test.tsx src/services/profileService.test.ts --maxWorkers=1
```

Expected: failures for missing validation/error UI and nondeterministic extension handling.

- [ ] **Step 3: Implement defensive avatar handling**

Add constants shared within the page/service as appropriate:

```ts
const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}
```

Validate MIME and size before setting the upload state. Show specific Thai errors in a live alert, clear the file input in `finally`, and keep the previous URL unless both upload and profile update succeed. Use `crypto.randomUUID()` for the object name and pass `contentType: file.type` to Storage.

Type profile statistics with `LearningActivityEvent[]`, calculate weekly day differences without `Math.abs`, ignore future/out-of-range dates, use `const`, and make memo dependencies match the values read. Provide a descriptive profile-image alt and `aria-busy` during upload.

- [ ] **Step 4: Harden the imperative migration**

Keep the public bucket but set bucket-level restrictions and mutation policies:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Each INSERT/UPDATE/DELETE policy includes bucket_id = 'avatars'.
-- INSERT checks (storage.foldername(name))[1] = (select auth.uid())::text.
-- UPDATE uses both USING and WITH CHECK and checks folder plus owner_id.
-- DELETE checks folder plus owner_id.
```

Drop policies by their known names before recreating them. Do not add a redundant public SELECT policy because public bucket delivery already provides public reads.

- [ ] **Step 5: Verify Profile tests and focused lint GREEN**

Run:

```powershell
npx vitest run src/pages/ProfilePage.test.tsx src/services/profileService.test.ts --maxWorkers=1
npx eslint src/pages/ProfilePage.tsx src/services/profileService.ts src/types/profile.ts --max-warnings=0
```

Expected: all pass with no warnings.

---

### Task 5: Clear remaining lint and formatting defects

**Files:**
- Modify: `src/pages/GrammarLessonPage.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: any edited source file still reported by the focused lint command

**Interfaces:**
- Consumes: current ESLint configuration and existing navigation callbacks.
- Produces: zero warnings/errors for the configured and edited-file lint scopes.

- [ ] **Step 1: Run the lint gates and capture RED**

Run:

```powershell
npm run lint
npx eslint src/components/flashcard/FlashcardSetup.tsx src/components/speak/ConversationPlayer.tsx src/components/speak/InteractivePracticePlayer.tsx src/components/vocabulary/VocabularyCard.tsx src/pages/HomePage.tsx src/pages/ProfilePage.tsx src/pages/SpeakModePage.tsx src/services/profileService.ts src/types/profile.ts --max-warnings=0
git diff --check
```

- [ ] **Step 2: Apply minimal source-level cleanup**

Remove `ListChecks` and other unused imports, make Home navigation lint-safe without changing hashes/callback behavior, correct effect dependencies, remove trailing whitespace, and retain every user-visible behavior covered by tests.

- [ ] **Step 3: Verify both lint gates GREEN**

Run the Step 1 commands. Expected: zero errors, zero warnings, and no whitespace reports.

---

### Task 6: Full verification and runtime QA

**Files:**
- Verify all changed files; modify only if a verification step exposes a root cause.

**Interfaces:**
- Produces: completion evidence for the full approved design.

- [ ] **Step 1: Run the complete automated suite**

Run:

```powershell
npm test
npm run build
npm run lint
```

Expected: each command exits 0; Vitest exits normally with zero unhandled errors.

- [ ] **Step 2: Run repository hygiene checks**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; status contains only intentional source/test/migration changes and pre-existing `skills-lock.json`.

- [ ] **Step 3: Run browser smoke checks**

Start Vite and inspect Home, Flashcard setup, Vocabulary, Speak conversation/practice, and Profile at mobile and desktop widths. Verify keyboard focus, long-name wrapping, empty activity state, avatar invalid/error/loading states, and that console/runtime errors are absent.

- [ ] **Step 4: Review the final diff against the design spec**

Compare every requirement in `docs/superpowers/specs/2026-07-15-project-bug-fixes-design.md` with test, build, lint, migration, and browser evidence. Do not mark complete until every requirement is proven.
