# Learning Activity Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist real learning activities and derive Day streak, Daily goal, and Today’s missions from those events for guests and signed-in users.

**Architecture:** Add a versioned local-first event ledger under `src/lib/activity/`. Every qualifying Flashcard, Quiz, Grammar, or Speak action writes an idempotent local event first; signed-in ledgers then use Pull → Normalize → Merge → Push background synchronization with Supabase. Home reads the active local ledger and derives all activity metrics through pure summary functions.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Vitest 4, Testing Library, LocalStorage, Supabase Postgres/RLS.

## Global Constraints

- Preserve all existing answer checking, progress data, routes, button actions, LocalStorage records, and Supabase tables.
- Do not create `003_quiz_history.sql`; that migration number remains reserved for the later Quiz History work.
- Use `004_learning_activity_events.sql` for this feature.
- Do not count page views, navigation, skips, setup actions, or failed progress writes.
- Do not invent Home values. Every displayed value must be derived from existing progress or a normalized ledger event.
- Keep Guest and User storage isolated. Claim Guest events only when User local and cloud ledgers are both empty and the Guest ledger has never been claimed.
- Never delete local activity because a cloud request failed.
- Cancel or discard stale sync work after sign-out or account change.
- Reuse existing Home mission images and existing actions/routes. Add no new button, route, notification, setting, or profile control.
- Preserve `object-fit: contain`, the mobile content order, the three-column stats row at 320px, and no horizontal overflow.
- The worktree is already dirty. Stage and commit only the explicit files named by each task; never use blanket `git add .`.

---

## Task 1: Define, normalize, store, and merge the local event ledger

**Files:**

- Create: `src/lib/activity/activityTypes.ts`
- Create: `src/lib/activity/activityKeys.ts`
- Create: `src/lib/activity/activityNormalizer.ts`
- Create: `src/lib/activity/activityLocalStorage.ts`
- Create: `src/lib/activity/activityMerge.ts`
- Create: `src/lib/activity/activityNormalizer.test.ts`
- Create: `src/lib/activity/activityLocalStorage.test.ts`
- Create: `src/lib/activity/activityMerge.test.ts`

- [ ] **Step 1: Write the failing normalization tests**

Cover these cases in `activityNormalizer.test.ts`:

- a valid version-1 ledger remains valid;
- malformed root data returns an empty version-1 ledger;
- invalid events are dropped without dropping valid siblings;
- unsupported `kind` or `mode`, blank IDs, invalid ISO timestamps, invalid `YYYY-MM-DD` dates, and offsets outside `-840..840` are rejected;
- metadata retains only boolean `correct`, boolean `wasDue`, and non-empty string `sessionId`;
- duplicate IDs keep the newer `occurredAt`; an exact timestamp tie keeps the earlier local entry;
- `updatedAt` is the greatest valid ledger/event timestamp or `null` for an empty ledger.

Run:

```powershell
npx vitest run src/lib/activity/activityNormalizer.test.ts
```

Expected: FAIL because `activityNormalizer.ts` and its types do not exist.

- [ ] **Step 2: Implement the types and normalizer**

Use these exact public types in `activityTypes.ts`:

```ts
export type LearningActivityKind =
  | "vocabulary_answer"
  | "grammar_answer"
  | "conversation_completed"

export type LearningActivityMode = "flashcard" | "quiz" | "grammar" | "speak"

export type LearningActivityMetadata = {
  correct?: boolean
  wasDue?: boolean
  sessionId?: string
}

export type LearningActivityEvent = {
  id: string
  kind: LearningActivityKind
  mode: LearningActivityMode
  entityId: string
  occurredAt: string
  localDate: string
  timezoneOffsetMinutes: number
  metadata?: LearningActivityMetadata
}

export type LearningActivityLedger = {
  version: 1
  events: LearningActivityEvent[]
  updatedAt: string | null
}

export type LearningActivityInput = Omit<
  LearningActivityEvent,
  "id" | "occurredAt" | "localDate" | "timezoneOffsetMinutes"
>
```

Export from `activityNormalizer.ts`:

```ts
export function createEmptyActivityLedger(): LearningActivityLedger
export function normalizeActivityEvent(value: unknown): LearningActivityEvent | null
export function normalizeActivityLedger(value: unknown): LearningActivityLedger
```

Do not mutate the input. Sort normalized events by `occurredAt`, then by `id`, so storage and tests are deterministic.

- [ ] **Step 3: Write the failing LocalStorage and merge tests**

`activityLocalStorage.test.ts` must verify:

- Guest key: `english-app:guest:learning-activity`;
- User key: `english-app:user:{userId}:learning-activity`;
- claim marker: `english-app:guest:learning-activity:claimed-by`;
- missing/corrupt storage returns an empty ledger;
- writes are normalized before serialization;
- a successful write emits one same-tab activity-ledger change event containing the affected storage key;
- the Guest claim marker round-trips without deleting Guest events.

`activityMerge.test.ts` must verify:

- union by event ID;
- newer `occurredAt` wins for the same ID;
- Local wins an exact timestamp tie;
- output is normalized, sorted, and has the newest `updatedAt`;
- neither input is mutated.

Run:

```powershell
npx vitest run src/lib/activity/activityLocalStorage.test.ts src/lib/activity/activityMerge.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 4: Implement keys, LocalStorage, and pure merge**

Export from `activityKeys.ts`:

```ts
export const GUEST_ACTIVITY_KEY = "english-app:guest:learning-activity"
export const GUEST_ACTIVITY_CLAIMED_BY_KEY =
  "english-app:guest:learning-activity:claimed-by"
export function getActivityStorageKey(userId: string | null | undefined): string
```

Export from `activityLocalStorage.ts`:

```ts
export function loadLocalActivityLedger(
  userId?: string | null,
): LearningActivityLedger
export function saveLocalActivityLedger(
  userId: string | null | undefined,
  ledger: LearningActivityLedger,
): LearningActivityLedger
export function getGuestActivityClaimedBy(): string | null
export function setGuestActivityClaimedBy(userId: string): void
```

Also export:

```ts
export const ACTIVITY_LEDGER_CHANGED_EVENT =
  "english-app:learning-activity-changed"
```

After a successful `localStorage.setItem`, dispatch a `CustomEvent` with `detail.storageKey`. This makes local event writes and completed cloud pulls observable in the current tab. Guard browser globals so pure tests and non-browser tooling can import the module safely.

Export from `activityMerge.ts`:

```ts
export function mergeActivityLedgers(
  local: LearningActivityLedger,
  cloud: LearningActivityLedger,
): LearningActivityLedger
```

- [ ] **Step 5: Run focused tests and commit**

```powershell
npx vitest run src/lib/activity/activityNormalizer.test.ts src/lib/activity/activityLocalStorage.test.ts src/lib/activity/activityMerge.test.ts
git add -- src/lib/activity/activityTypes.ts src/lib/activity/activityKeys.ts src/lib/activity/activityNormalizer.ts src/lib/activity/activityLocalStorage.ts src/lib/activity/activityMerge.ts src/lib/activity/activityNormalizer.test.ts src/lib/activity/activityLocalStorage.test.ts src/lib/activity/activityMerge.test.ts
git commit -m "feat: add local learning activity ledger"
```

Expected: all focused tests PASS and the commit contains only the nine files above.

---

## Task 2: Derive streak, daily goal, and mission progress with pure functions

**Files:**

- Create: `src/lib/activity/activitySummary.ts`
- Create: `src/lib/activity/activitySummary.test.ts`

- [ ] **Step 1: Write the failing summary tests**

Create deterministic events with explicit local dates. Cover:

- empty ledger: streak `0`, Daily goal `0/15`, Flashcards `0/10`, Speak `0/1`;
- streak anchored today when today is active;
- streak anchored yesterday when today is not yet active;
- a two-day gap resets streak to `0`;
- continuity across month and year boundaries;
- duplicate event IDs count once;
- distinct attempts for the same entity count separately toward Daily goal;
- Daily goal includes every qualifying kind/mode but caps displayed completion at `15`;
- Review counts unique due vocabulary IDs only;
- Review target is `min(5, dueReviewWordsNow + reviewedDueWordCountToday)`;
- Review is hidden only when its adaptive target is `0`;
- Flashcards counts only `vocabulary_answer` + `flashcard`, not Grammar flashcards;
- Speak counts unique completed conversation IDs and caps display at `1`.

Run:

```powershell
npx vitest run src/lib/activity/activitySummary.test.ts
```

Expected: FAIL because `activitySummary.ts` does not exist.

- [ ] **Step 2: Implement the summary API**

Use these constants and result shape:

```ts
export const DAILY_ACTIVITY_GOAL = 15
export const FLASHCARD_MISSION_TARGET = 10
export const SPEAK_MISSION_TARGET = 1
export const MAX_REVIEW_MISSION_TARGET = 5

export type ActivityProgress = {
  completed: number
  target: number
  percentage: number
  isComplete: boolean
}

export type LearningActivitySummary = {
  streakDays: number
  dailyGoal: ActivityProgress
  missions: {
    review: ActivityProgress & { visible: boolean }
    flashcards: ActivityProgress
    speak: ActivityProgress
  }
}

export function summarizeLearningActivity(
  ledger: LearningActivityLedger,
  options: { now: Date; dueReviewWordsNow: number },
): LearningActivitySummary
```

Implement local-calendar helpers without parsing a `YYYY-MM-DD` value through UTC:

```ts
export function toLocalDateKey(date: Date): string
export function addLocalCalendarDays(localDate: string, amount: number): string
```

Always normalize/deduplicate the ledger before calculation. Clamp percentages to `0..100` and return finite values for every input.

- [ ] **Step 3: Run focused tests and commit**

```powershell
npx vitest run src/lib/activity/activitySummary.test.ts
git add -- src/lib/activity/activitySummary.ts src/lib/activity/activitySummary.test.ts
git commit -m "feat: derive activity streak and missions"
```

Expected: all summary tests PASS.

---

## Task 3: Add the hardened Supabase activity table and cloud repository

**Files:**

- Create: `supabase/migrations/004_learning_activity_events.sql`
- Create: `src/lib/activity/activityCloudRepository.ts`
- Create: `src/lib/activity/activityCloudRepository.test.ts`
- Create: `src/lib/activity/activityMigration.test.ts`

- [ ] **Step 1: Write the failing SQL contract tests**

Read the migration text in `activityMigration.test.ts` and assert it contains:

- `create table if not exists public.learning_activity_events`;
- `id text primary key` and `user_id uuid not null references auth.users(id) on delete cascade`;
- checks for all allowed `kind` and `mode` values;
- timezone offset constraint `between -840 and 840`;
- index on `(user_id, local_date)`;
- RLS enabled;
- separate SELECT, INSERT, UPDATE, and DELETE policies;
- both `USING` and `WITH CHECK` where appropriate;
- authenticated-only table grants after privilege reset.

Run:

```powershell
npx vitest run src/lib/activity/activityMigration.test.ts
```

Expected: FAIL because migration 004 does not exist.

- [ ] **Step 2: Implement migration 004**

Create this schema idempotently:

```sql
create table if not exists public.learning_activity_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  mode text not null,
  entity_id text not null,
  occurred_at timestamptz not null,
  local_date date not null,
  timezone_offset_minutes integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

Use named constraints inside `DO $$` guards so rerunning does not duplicate constraints. Drop old policies for this table before recreating four explicit policies. Every ownership expression must be `auth.uid() = user_id`; INSERT uses `WITH CHECK`, UPDATE uses both `USING` and `WITH CHECK`.

- [ ] **Step 3: Write failing cloud repository tests**

Mock `../supabaseClient`. Verify:

- DB rows map camelCase/snake_case correctly;
- load filters by the requested `user_id` and normalizes the returned ledger;
- upsert always overwrites row `user_id` with the authenticated user argument;
- empty event arrays avoid an unnecessary upsert;
- Supabase errors throw so the sync manager can retry.

Run:

```powershell
npx vitest run src/lib/activity/activityCloudRepository.test.ts
```

Expected: FAIL because the repository does not exist.

- [ ] **Step 4: Implement the cloud repository**

Export:

```ts
export function activityEventToRow(
  userId: string,
  event: LearningActivityEvent,
): LearningActivityEventRow

export function activityRowToEvent(row: unknown): LearningActivityEvent | null

export async function loadCloudActivityLedger(
  userId: string,
): Promise<LearningActivityLedger>

export async function upsertCloudActivityEvents(
  userId: string,
  events: LearningActivityEvent[],
): Promise<void>
```

Use `.from("learning_activity_events")`, `.select(...)`, `.eq("user_id", userId)`, and `.upsert(rows, { onConflict: "id" })`. Never use a service-role key in the browser.

- [ ] **Step 5: Run focused tests and commit**

```powershell
npx vitest run src/lib/activity/activityMigration.test.ts src/lib/activity/activityCloudRepository.test.ts
git add -- supabase/migrations/004_learning_activity_events.sql src/lib/activity/activityCloudRepository.ts src/lib/activity/activityCloudRepository.test.ts src/lib/activity/activityMigration.test.ts
git commit -m "feat: add activity ledger Supabase storage"
```

Expected: migration and repository tests PASS.

---

## Task 4: Synchronize activity ledgers and apply the guarded Guest claim

**Files:**

- Create: `src/lib/activity/activitySyncManager.ts`
- Create: `src/lib/activity/activitySyncManager.test.ts`
- Modify: `src/hooks/useAuth.ts`
- Create: `src/hooks/useAuth.activitySync.test.ts`

- [ ] **Step 1: Write failing sync-manager tests**

Mock local and cloud repositories and use fake timers. Verify:

- `handleActivitySignIn(userId)` pulls cloud, merges with current User local, persists merged local, then upserts merged events;
- Guest claims only if User local and cloud are both empty, Guest has events, and no claim marker exists;
- a non-empty User local or cloud ledger prevents Guest claim;
- a prior claim marker prevents a second claim;
- claim marker is written only after the claimed data has been persisted locally and pushed successfully;
- scheduled sync pulls cloud again before merge/push;
- cloud failure preserves local and schedules bounded retry;
- an `online` event retries queued work;
- sign-out clears timer, increments generation, and sets active user to `null`;
- a stale response from User A cannot write into User B after account switch.

Run:

```powershell
npx vitest run src/lib/activity/activitySyncManager.test.ts
```

Expected: FAIL because `activitySyncManager.ts` does not exist.

- [ ] **Step 2: Implement the sync manager**

Mirror the established vocabulary sync lifecycle but keep independent module state. Export:

```ts
export function getActiveActivityUserId(): string | null
export function handleActivitySignOut(): void
export async function handleActivitySignIn(userId: string): Promise<void>
export function scheduleActivitySync(): void
```

Required ordering inside every queue flush:

```text
load current User local
→ pull latest User cloud
→ normalize both
→ merge by event ID
→ verify generation and active user
→ save merged User local
→ upsert merged events
→ verify generation and active user again
```

Use one debounced timer, a monotonic generation number, a bounded retry count, and one browser `online` listener. Do not clear local data on any exception.

- [ ] **Step 3: Write the failing Auth integration test**

In `useAuth.activitySync.test.ts`, mock both sync managers and the Supabase auth callback. Assert:

- initial signed-in session runs vocabulary and activity sign-in handlers;
- `SIGNED_OUT` runs both sign-out handlers;
- switching users signs out/cancels the old activity generation before starting the new one;
- an activity-sync error does not prevent auth state from settling or vocabulary sync from running.

Run:

```powershell
npx vitest run src/hooks/useAuth.activitySync.test.ts
```

Expected: FAIL because `useAuth.ts` only coordinates vocabulary sync.

- [ ] **Step 4: Coordinate both sync managers in `useAuth.ts`**

Alias imports to avoid ambiguous names:

```ts
import {
  handleSignIn as handleVocabularySignIn,
  handleSignOut as handleVocabularySignOut,
} from "../lib/progress/syncManager"
import {
  handleActivitySignIn,
  handleActivitySignOut,
} from "../lib/activity/activitySyncManager"
```

On a User change, cancel both previous managers before starting the new User’s sign-in work. Run the two sign-in operations independently with `Promise.allSettled` so one store cannot block the other or auth rendering.

- [ ] **Step 5: Run focused tests and commit**

```powershell
npx vitest run src/lib/activity/activitySyncManager.test.ts src/hooks/useAuth.activitySync.test.ts
git add -- src/lib/activity/activitySyncManager.ts src/lib/activity/activitySyncManager.test.ts src/hooks/useAuth.ts src/hooks/useAuth.activitySync.test.ts
git commit -m "feat: sync learning activities across accounts"
```

Expected: sync and Auth integration tests PASS.

---

## Task 5: Record idempotent local-first learning events

**Files:**

- Create: `src/lib/activity/recordLearningActivity.ts`
- Create: `src/lib/activity/recordLearningActivity.test.ts`

- [ ] **Step 1: Write the failing recording tests**

Mock `activityLocalStorage` and the now-existing `activitySyncManager`. Verify:

- a supplied `eventId` is preserved;
- a missing ID uses `crypto.randomUUID()`;
- `occurredAt`, `localDate`, and `timezoneOffsetMinutes` come from the same supplied `Date`;
- Guest writes the Guest ledger and does not schedule cloud sync;
- an active signed-in user writes that User’s local ledger then schedules sync;
- recording the same deterministic ID twice leaves one event;
- a LocalStorage exception propagates and does not schedule sync;
- Speak deterministic ID changes by conversation or local date, but not by repeated completion calls on the same date.

Run:

```powershell
npx vitest run src/lib/activity/recordLearningActivity.test.ts
```

Expected: FAIL because `recordLearningActivity.ts` does not exist.

- [ ] **Step 2: Implement the recorder**

Export this API:

```ts
export type RecordLearningActivityOptions = {
  userId?: string | null
  eventId?: string
  now?: Date
}

export function createLearningActivityEvent(
  input: LearningActivityInput,
  options?: Pick<RecordLearningActivityOptions, "eventId" | "now">,
): LearningActivityEvent

export function getConversationCompletionEventId(
  scope: string,
  conversationId: string,
  localDate: string,
): string

export function recordLearningActivity(
  input: LearningActivityInput,
  options?: RecordLearningActivityOptions,
): LearningActivityEvent
```

The default scope is the active activity-sync user; otherwise it is Guest. Write and normalize LocalStorage synchronously before calling `scheduleActivitySync()`. Use a text-safe deterministic Speak ID such as:

```ts
`speak:${encodeURIComponent(scope)}:${encodeURIComponent(conversationId)}:${localDate}`
```

- [ ] **Step 3: Run focused tests and commit**

```powershell
npx vitest run src/lib/activity/recordLearningActivity.test.ts
git add -- src/lib/activity/recordLearningActivity.ts src/lib/activity/recordLearningActivity.test.ts
git commit -m "feat: record local-first learning activities"
```

Expected: all recorder tests PASS.

---

## Task 6: Instrument vocabulary Flashcard and Quiz answers

**Files:**

- Modify: `src/components/flashcard/FlashcardPractice.tsx`
- Create or Modify: `src/components/flashcard/FlashcardPractice.activity.test.tsx`
- Modify: `src/components/quiz/QuizPractice.tsx`
- Create: `src/components/quiz/QuizPractice.activity.test.tsx`

- [ ] **Step 1: Write failing Flashcard activity tests**

Mock `recordLearningActivity`, vocabulary progress, SRS progress, and grammar progress. Verify:

- each accepted vocabulary answer records exactly one `vocabulary_answer` with `mode: "flashcard"`;
- `metadata.correct` matches the accepted answer;
- `metadata.wasDue` is captured before vocabulary/SRS progress is updated;
- repeated React rendering does not create another event;
- a thrown vocabulary/SRS progress write produces no event;
- Grammar flashcards are not double-recorded by this component; the Grammar hook owns those events.

Run:

```powershell
npx vitest run src/components/flashcard/FlashcardPractice.activity.test.tsx
```

Expected: FAIL because Flashcard answers do not record activity.

- [ ] **Step 2: Instrument Flashcard after successful progress mutation**

Generate one session ID per mounted practice session with `useRef`. Determine `wasDue` before calling `updateWordProgress` or `processSrsAnswer`. Immediately after that existing function returns successfully, call:

```ts
recordLearningActivity({
  kind: "vocabulary_answer",
  mode: "flashcard",
  entityId: card.wordId,
  metadata: { correct: isCorrect, wasDue, sessionId: sessionId.current },
})
```

Do not move or alter the existing answer evaluation, progress update, next-card behavior, route, or button action.

- [ ] **Step 3: Write failing Quiz activity tests**

Verify:

- every accepted correct or incorrect answer records one `vocabulary_answer` with `mode: "quiz"`;
- the event is written only after `nextResult` has accepted the answer;
- the current word ID, correctness, and stable session ID are included;
- Skip records no event;
- completing the last question still records the last answer once before `onComplete`.

Run:

```powershell
npx vitest run src/components/quiz/QuizPractice.activity.test.tsx
```

Expected: FAIL because Quiz answers do not record activity.

- [ ] **Step 4: Instrument Quiz without creating Quiz History**

Create one session ID per mounted Quiz practice. In `handleAnswer`, construct `nextResult` first, then write:

```ts
recordLearningActivity({
  kind: "vocabulary_answer",
  mode: "quiz",
  entityId: currentWord.id,
  metadata: { correct: isCorrect, sessionId: sessionId.current },
})
```

Then preserve the existing state transition or `onComplete(nextResult)`. Do not call `saveQuizResult`, add answer fields to question components, or create `003_quiz_history.sql`; the later Quiz History feature remains separate.

- [ ] **Step 5: Run focused and existing component tests, then commit**

```powershell
npx vitest run src/components/flashcard/FlashcardPractice.activity.test.tsx src/components/quiz/QuizPractice.activity.test.tsx src/pages/FlashcardPage.test.tsx src/pages/QuizPage.test.tsx
git add -- src/components/flashcard/FlashcardPractice.tsx src/components/flashcard/FlashcardPractice.activity.test.tsx src/components/quiz/QuizPractice.tsx src/components/quiz/QuizPractice.activity.test.tsx
git commit -m "feat: record flashcard and quiz activities"
```

Expected: focused and existing Flashcard/Quiz tests PASS.

---

## Task 7: Instrument Grammar answers after progress persistence

**Files:**

- Modify: `src/hooks/useGrammarProgress.ts`
- Create: `src/hooks/useGrammarProgress.activity.test.tsx`

- [ ] **Step 1: Write failing Grammar activity tests**

Mock `saveGrammarProgress` and `recordLearningActivity`. Verify for both `recordAttempt` and `recordFlashcardAttempt`:

- the activity is `grammar_answer` with `mode: "grammar"`;
- the entity is `questionId` or `patternId` respectively;
- correctness is preserved;
- event recording occurs after the awaited progress save resolves;
- a rejected local progress save records no event;
- two rapid answers both build from the latest in-memory progress rather than losing the first update;
- one invocation records one event even when React rerenders.

Run:

```powershell
npx vitest run src/hooks/useGrammarProgress.activity.test.tsx
```

Expected: FAIL because the hook currently fires unawaited saves inside state updaters and does not record events.

- [ ] **Step 2: Make Grammar updates persist-then-record**

Refactor each answer method so its next progress value is computed once from a synchronous `progressRef`, set into both the ref and React state, then persisted outside the state-updater callback. Initialize/update the ref whenever loaded progress changes so rapid answers cannot read a stale render closure:

```ts
const current = progressRef.current
if (!current) return
const next = buildNextGrammarProgress(current, /* answer inputs */)
progressRef.current = next
setProgress(next)
await saveGrammarProgress(user?.id, next)
recordLearningActivity({
  kind: "grammar_answer",
  mode: "grammar",
  entityId: questionId,
  metadata: { correct: evaluation.correct },
})
```

Extract pure internal builders if that keeps the two methods readable. Preserve all mastery, accuracy, mistake, and resolution calculations exactly. Do not add events to `markTopicViewed` or `markTopicCompleted`.

- [ ] **Step 3: Run focused Grammar tests and commit**

```powershell
npx vitest run src/hooks/useGrammarProgress.activity.test.tsx src/data/grammar/practiceEngine.test.ts src/pages/GrammarLessonPage.test.tsx
git add -- src/hooks/useGrammarProgress.ts src/hooks/useGrammarProgress.activity.test.tsx
git commit -m "feat: record persisted grammar activities"
```

Expected: focused and existing Grammar tests PASS.

---

## Task 8: Instrument unique Speak conversation completions

**Files:**

- Modify: `src/pages/SpeakModePage.tsx`
- Create: `src/pages/SpeakModePage.activity.test.tsx`

- [ ] **Step 1: Write failing Speak completion tests**

Mock `saveSpeakModeProgress`, `recordLearningActivity`, and the current date. Verify:

- first completion persists `completedConversations` then records one `conversation_completed` event;
- repeated completion of the same conversation does not mutate progress or create another event;
- deterministic ID uses active User/Guest scope, conversation ID, and local date;
- a thrown local progress save records no event;
- existing navigation to the next conversation still occurs.

Run:

```powershell
npx vitest run src/pages/SpeakModePage.activity.test.tsx
```

Expected: FAIL because Speak completion does not write the activity ledger.

- [ ] **Step 2: Persist and record only the first completion**

Move completion logic out of a side-effectful state updater. When the selected conversation is not already completed:

1. construct `newProgress`;
2. call `saveSpeakModeProgress(newProgress)`;
3. set state to `newProgress`;
4. build the current local date;
5. call `recordLearningActivity` with the deterministic event ID.

```ts
recordLearningActivity(
  {
    kind: "conversation_completed",
    mode: "speak",
    entityId: selectedConversationId,
  },
  { eventId: getConversationCompletionEventId(scope, selectedConversationId, localDate) },
)
```

Keep the existing next-conversation/practice navigation unchanged.

- [ ] **Step 3: Run focused Speak tests and commit**

```powershell
npx vitest run src/pages/SpeakModePage.activity.test.tsx
git add -- src/pages/SpeakModePage.tsx src/pages/SpeakModePage.activity.test.tsx
git commit -m "feat: record completed speak conversations"
```

Expected: Speak activity tests PASS.

---

## Task 9: Render real Home stats and Today’s missions

**Files:**

- Copy: `C:/Users/team7/Downloads/day streak.png` → `src/assets/images/stat-day-streak.png`
- Copy: `C:/Users/team7/Downloads/daily goal.png` → `src/assets/images/stat-daily-goal.png`
- Create: `src/hooks/useLearningActivityLedger.ts`
- Create: `src/hooks/useLearningActivityLedger.test.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/HomePage.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing reactive-ledger hook tests**

Verify that `useLearningActivityLedger(userId)`:

- initializes from the Guest or matching User LocalStorage key;
- reloads after `ACTIVITY_LEDGER_CHANGED_EVENT` for its own storage key;
- ignores events for another User’s key;
- reloads on a cross-tab browser `storage` event;
- switches snapshots cleanly when `userId` changes.

Run:

```powershell
npx vitest run src/hooks/useLearningActivityLedger.test.tsx
```

Expected: FAIL because the hook does not exist.

- [ ] **Step 2: Implement the reactive local-ledger hook**

Use `useState` + `useEffect` with the current storage key. Listen to both the custom same-tab event and the native cross-tab `storage` event, and clean up both listeners on User change/unmount:

```ts
export function useLearningActivityLedger(
  userId?: string | null,
): LearningActivityLedger
```

The hook always returns a normalized ledger and never fetches Supabase directly; the sync manager remains the only cloud owner.

- [ ] **Step 3: Write failing Home tests with real ledger fixtures**

Mock the active ledger and existing vocabulary due count. Verify:

- Stats render in order: Day streak, Daily goal, Words learned;
- streak and Daily goal values exactly match `summarizeLearningActivity`;
- Daily goal displays capped progress against 15;
- Review mission is absent when adaptive target is `0`;
- Review, Flashcards, and Speak show real completed/target values and percentages when eligible;
- mission items use existing handlers/routes: Review/Flashcards call the existing Flashcard action and Speak navigates to the existing Speak route;
- no notification/profile/settings/help/new action appears;
- mobile DOM order is Hero → Stats → Continue learning → Today’s missions → Explore → Quick review.

Run:

```powershell
npx vitest run src/pages/HomePage.test.tsx
```

Expected: FAIL because Home currently renders only Words learned and hides missions.

- [ ] **Step 4: Copy the two approved stat images**

Use their supplied source files without image generation or cropping. Preserve transparency and render them with `object-fit: contain`.

- [ ] **Step 5: Read active real data and render the three stats**

In `HomePage.tsx`:

```ts
const activityLedger = useLearningActivityLedger(user?.id)
const activity = summarizeLearningActivity(activityLedger, {
  now: new Date(),
  dueReviewWordsNow: progress.dueReviewWords,
})
```

Do not duplicate summary formulas in JSX. Use the current `getHomeProgressSummary()` result for Words learned and due-review count.

- [ ] **Step 6: Render Today’s missions from the summary**

Use existing `mission-review.png`, `mission-flashcard.png`, and `mission-speak.png`. Each visible item contains its existing icon, title, factual completed/target detail, and a progress bar. Conditionally render Review only when `activity.missions.review.visible` is true. Always render Flashcards and Speak.

Use only existing actions:

- Review → the current review-flashcard action when due words exist;
- Flashcards → existing `onStartFlashcard`;
- Speak → existing `#speak` route action.

If the current Home mission card is non-interactive, keep it non-interactive rather than adding buttons. Do not create a “See all” action unless the project already has one wired to an existing route.

- [ ] **Step 7: Add responsive styles**

Ensure:

- Desktop stats are one row of three equal items beneath Hero;
- Desktop missions remain a vertical card in the right column;
- Mobile content order matches the approved order;
- at 320px, stats remain three columns by reducing gap, icon size, and type size;
- long localized labels wrap within their own grid cell;
- all activity images use `object-fit: contain` and are never clipped;
- no element creates horizontal overflow.

- [ ] **Step 8: Run Home, hook, and progress tests, then commit**

```powershell
npx vitest run src/hooks/useLearningActivityLedger.test.tsx src/pages/HomePage.test.tsx src/utils/homeProgress.test.ts src/lib/activity/activitySummary.test.ts
git add -- src/assets/images/stat-day-streak.png src/assets/images/stat-daily-goal.png src/hooks/useLearningActivityLedger.ts src/hooks/useLearningActivityLedger.test.tsx src/pages/HomePage.tsx src/pages/HomePage.test.tsx src/styles.css
git commit -m "feat: show real streak goal and missions on home"
```

Expected: Home tests PASS and the commit contains no new routes or controls.

---

## Task 10: Verify behavior, synchronization, migration safety, and responsive layout

**Files:**

- Modify only files that fail a verification below, and keep each repair within this feature’s approved scope.

- [ ] **Step 1: Run all activity-focused tests together**

```powershell
npx vitest run src/lib/activity src/hooks/useAuth.activitySync.test.ts src/hooks/useGrammarProgress.activity.test.tsx src/components/flashcard/FlashcardPractice.activity.test.tsx src/components/quiz/QuizPractice.activity.test.tsx src/pages/SpeakModePage.activity.test.tsx src/pages/HomePage.test.tsx
```

Expected: PASS with no unhandled rejection or timer warning.

- [ ] **Step 2: Run affected existing regression tests**

```powershell
npx vitest run src/pages/FlashcardPage.test.tsx src/pages/FlashcardPage.hardening.test.tsx src/pages/QuizPage.test.tsx src/pages/QuizPage.hardening.test.tsx src/pages/GrammarLessonPage.test.tsx src/App.test.tsx src/App.hash-routing.test.tsx src/App.navigation.test.tsx
```

Expected: PASS. If a failure predates this feature, record the exact command and error separately; do not change unrelated user work merely to make the suite green.

- [ ] **Step 3: Run the full test suite and production build**

```powershell
npm test
npm run build
```

Expected: PASS. Before build, provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` through the local environment; never commit real keys. If the baseline still fails for known unrelated dirty-worktree changes, document those failures and confirm every focused suite still passes.

- [ ] **Step 4: Validate migration 004 in Supabase**

Apply migrations in a disposable Supabase environment, then verify as two distinct authenticated users:

```sql
select id, user_id, kind, mode, entity_id, local_date
from public.learning_activity_events
order by created_at desc;
```

Confirm User A cannot select, insert, update, or delete User B rows. Rerun migration 004 and confirm it is idempotent. Confirm the browser uses the publishable key and RLS, never a service-role key.

- [ ] **Step 5: Perform manual local-first scenarios**

Use a clean browser profile and verify:

1. Guest answers one Flashcard; Home shows Daily goal `1/15`, Flashcards `1/10`, and streak `1`.
2. Guest refreshes offline; the same values remain.
3. A due word reviewed twice counts once for Review but twice for Flashcards/Daily goal as two real attempts.
4. A Quiz answer increments Daily goal but not Flashcards.
5. A Grammar answer increments Daily goal but not Flashcards.
6. Completing one Speak conversation increments Daily goal and completes Speak `1/1`; repeating the same conversation that day does not add another completion event.
7. A new empty User claims unclaimed Guest events once.
8. A User with any local or cloud activity does not claim Guest events.
9. Switching accounts during delayed sync never moves events across users.
10. Cloud failure leaves local values intact and later online retry synchronizes them.

- [ ] **Step 6: Perform responsive visual QA**

Use the local development server and inspect widths `320`, `375`, `768`, `1024`, and `1440` pixels. Confirm:

- no horizontal scrollbar;
- no text overlaps an image;
- all three stats remain in one mobile row;
- approved mobile order is preserved;
- Review mission disappears cleanly at target zero;
- mission progress bars remain within their cards;
- supplied transparent PNGs are fully visible with `object-fit: contain`.

- [ ] **Step 7: Review the final diff and commit only verification repairs**

```powershell
git diff --check
git status --short
```

If verification required feature-scoped repairs, stage only those exact repaired files and commit:

```powershell
git commit -m "fix: harden learning activity ledger"
```

If no repair was needed, do not create an empty commit. Record focused test results, full-suite/build results, Supabase/RLS results, and responsive QA results in the implementation handoff.
