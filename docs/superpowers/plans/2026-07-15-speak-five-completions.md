# Speak Five-Completions Mission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Count each completed conversation-listening round toward a five-completion daily Speak mission on Home, including intentional repeats of the same lesson without double-counting one pass.

**Architecture:** `ConversationPlayer` owns the listening-round boundary and emits one final-line signal per pass. `SpeakModePage` separates completion recording from navigation, persists unique lesson state, and emits a fresh activity event for every valid round. The activity summary counts today's Speak completion events and caps Home progress at five.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, local activity ledger, ESLint

## Global Constraints

- A round completes when the final conversation line becomes active after playback is attempted.
- Restarting or reopening the same conversation starts a countable new round.
- Back/forward navigation and the final completion button do not add a second event within one pass.
- The daily Speak mission target is exactly `5`; display is capped at `5/5` while extra events remain stored.
- Persistent `completedConversations` remains a unique lesson-state list.
- Activity synchronization, daily-goal, streak, and other missions remain unchanged.
- Preserve all pre-existing working-tree changes. For already-modified files, stage only feature hunks with `git add -p` and review the cached diff.

---

## File Structure

- Modify `src/lib/activity/activitySummary.ts`: five-event target and event-count aggregation.
- Modify `src/lib/activity/activitySummary.test.ts`: repeated-round and cap tests.
- Modify `src/pages/HomePage.test.tsx`: rendered `1 / 5` and `5 / 5` contracts.
- Modify `src/components/speak/ConversationPlayer.tsx`: Restart guard reset and callback ordering.
- Create `src/components/speak/ConversationPlayer.activity.test.tsx`: player round-boundary regression test.
- Modify `src/pages/SpeakModePage.tsx`: final-line recording and navigation separation.
- Modify `src/pages/SpeakModePage.activity.test.tsx`: final-line, repeat, ordering, and navigation tests.

### Task 1: Count Five Daily Speak Completion Events

**Files:**
- Modify: `src/lib/activity/activitySummary.test.ts`
- Modify: `src/lib/activity/activitySummary.ts`
- Modify: `src/pages/HomePage.test.tsx`

**Interfaces:**
- Consumes: normalized `LearningActivityEvent[]`.
- Produces: `SPEAK_MISSION_TARGET = 5` and `missions.speak` based on today's completion-event count.

- [ ] **Step 1: Write failing aggregation tests**

Change the empty-ledger target to five and replace the distinct-conversation assertion with this repeated-round contract:

```ts
it("counts repeated Speak rounds and caps the five-completion mission", () => {
  const repeatedRounds = Array.from({ length: 6 }, (_, index) =>
    event(`speak-${index}`, "2026-07-13", {
      kind: "conversation_completed",
      mode: "speak",
      entityId: "conversation-1",
    }),
  )

  const twoRounds = summarizeLearningActivity(
    ledger(repeatedRounds.slice(0, 2)),
    { now, dueReviewWordsNow: 0 },
  )
  const sixRounds = summarizeLearningActivity(ledger(repeatedRounds), {
    now,
    dueReviewWordsNow: 0,
  })

  expect(twoRounds.missions.speak).toEqual({
    completed: 2,
    target: 5,
    percentage: 40,
    isComplete: false,
  })
  expect(sixRounds.missions.speak).toEqual({
    completed: 5,
    target: 5,
    percentage: 100,
    isComplete: true,
  })
})
```

- [ ] **Step 2: Run RED aggregation test**

Run: `npx vitest run src/lib/activity/activitySummary.test.ts --maxWorkers=1`

Expected: FAIL because the target is `1` and repeated entity IDs are collapsed by a `Set`.

- [ ] **Step 3: Implement event counting**

In `activitySummary.ts`:

```ts
export const SPEAK_MISSION_TARGET = 5
```

```ts
const speakCompletionCount = todayEvents.filter(
  (event) =>
    event.kind === "conversation_completed" && event.mode === "speak",
).length
```

```ts
speak: toProgress(speakCompletionCount, SPEAK_MISSION_TARGET),
```

- [ ] **Step 4: Run GREEN aggregation test**

Run: `npx vitest run src/lib/activity/activitySummary.test.ts --maxWorkers=1`

Expected: all tests PASS.

- [ ] **Step 5: Update the Home rendering contract**

Change the existing Speak text assertion to:

```ts
expect(within(missions).getByText("1 / 5")).toBeInTheDocument()
```

Add a five-event UI test:

```tsx
it("renders a full Speak mission after five completed rounds", () => {
  setActivities(
    ...Array.from({ length: 5 }, (_, index) =>
      activity(`speak-${index}`, {
        kind: "conversation_completed",
        mode: "speak",
        entityId: "conversation-1",
      }),
    ),
  )

  render(<HomePage />)
  const missions = screen.getByRole("region", { name: "ภารกิจประจำวัน" })
  expect(within(missions).getByText("5 / 5")).toBeInTheDocument()
  expect(
    within(missions).getByRole("progressbar", { name: "ฝึกพูด progress" }),
  ).toHaveAttribute("aria-valuenow", "100")
})
```

Run: `npx vitest run src/lib/activity/activitySummary.test.ts src/pages/HomePage.test.tsx --maxWorkers=1`

Expected: both files PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git diff -- src/lib/activity/activitySummary.ts src/lib/activity/activitySummary.test.ts src/pages/HomePage.test.tsx
git add -p -- src/lib/activity/activitySummary.ts src/lib/activity/activitySummary.test.ts src/pages/HomePage.test.tsx
git diff --cached --check
git diff --cached
git commit -m "feat: count five daily speak completions"
```

Expected: cached content contains only target/count and matching tests.

### Task 2: Emit One Signal Per Listening Round

**Files:**
- Create: `src/components/speak/ConversationPlayer.activity.test.tsx`
- Modify: `src/components/speak/ConversationPlayer.tsx`

**Interfaces:**
- Consumes: `onReachedLastLine?: () => void`.
- Produces: one callback after final-line playback is attempted per pass; Restart creates a new pass.

- [ ] **Step 1: Write the failing player test**

Create `ConversationPlayer.activity.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ConversationLine } from "../../types/conversation"
import { speakText } from "../../utils/speech"
import { ConversationPlayer } from "./ConversationPlayer"

vi.mock("../../utils/speech", () => ({
  speakText: vi.fn(),
  toggleSpeech: vi.fn(),
}))

const baseLine = {
  categoryId: "category-1",
  categoryTitle: "Daily life",
  categoryThai: "ชีวิตประจำวัน",
  conversationId: "conversation-1",
  conversationNo: 1,
  conversationTitle: "At a cafe",
}
const lines: ConversationLine[] = [
  { ...baseLine, lineNo: 1, speaker: "A", english: "Hello", thai: "สวัสดี" },
  { ...baseLine, lineNo: 2, speaker: "B", english: "Welcome", thai: "ยินดีต้อนรับ" },
]

describe("ConversationPlayer completion rounds", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = vi.fn()
  })

  it("signals once per pass and again after Restart", async () => {
    const user = userEvent.setup()
    const onReachedLastLine = vi.fn()
    render(
      <ConversationPlayer
        title="At a cafe"
        lines={lines}
        onReachedLastLine={onReachedLastLine}
      />,
    )

    fireEvent.keyDown(window, { code: "ArrowRight" })
    await waitFor(() => expect(onReachedLastLine).toHaveBeenCalledTimes(1))
    expect(vi.mocked(speakText).mock.invocationCallOrder[1]).toBeLessThan(
      onReachedLastLine.mock.invocationCallOrder[0],
    )

    fireEvent.keyDown(window, { code: "ArrowLeft" })
    fireEvent.keyDown(window, { code: "ArrowRight" })
    expect(onReachedLastLine).toHaveBeenCalledTimes(1)

    await user.click(screen.getByTitle("เริ่มใหม่"))
    fireEvent.keyDown(window, { code: "ArrowRight" })
    await waitFor(() => expect(onReachedLastLine).toHaveBeenCalledTimes(2))
  })
})
```

- [ ] **Step 2: Run RED player test**

Run: `npx vitest run src/components/speak/ConversationPlayer.activity.test.tsx --maxWorkers=1`

Expected: FAIL because Restart does not reset the final-line guard and the callback runs before the final playback effect.

- [ ] **Step 3: Implement the round boundary**

Move the existing `onReachedLastLine` effect below the autoplay effect and keep this condition:

```ts
useEffect(() => {
  if (
    lines.length > 0 &&
    currentIndex === lines.length - 1 &&
    onReachedLastLine &&
    !hasReachedEndRef.current
  ) {
    hasReachedEndRef.current = true
    onReachedLastLine()
  }
}, [currentIndex, lines.length, onReachedLastLine])
```

Reset the guard on Restart:

```ts
const handleRestart = () => {
  hasReachedEndRef.current = false
  setCurrentIndex(0)
}
```

- [ ] **Step 4: Run GREEN player test**

Run: `npx vitest run src/components/speak/ConversationPlayer.activity.test.tsx --maxWorkers=1`

Expected: PASS with callback counts `1`, then `1`, then `2`.

- [ ] **Step 5: Commit Task 2**

```bash
git diff -- src/components/speak/ConversationPlayer.tsx src/components/speak/ConversationPlayer.activity.test.tsx
git add -p -- src/components/speak/ConversationPlayer.tsx
git add -- src/components/speak/ConversationPlayer.activity.test.tsx
git diff --cached --check
git diff --cached
git commit -m "feat: track speak listening rounds"
```

Expected: cached content contains only guard/effect changes and the new test.

### Task 3: Record Final-Line Events Without Same-Round Duplication

**Files:**
- Modify: `src/pages/SpeakModePage.activity.test.tsx`
- Modify: `src/pages/SpeakModePage.tsx`

**Interfaces:**
- Consumes: Task 2's `onReachedLastLine`; `recordLearningActivity(input)` supplies a fresh generated ID.
- Produces: `recordConversationCompletion(conversationId: string): void` for persistence/activity and navigation-only `handleConversationComplete(): void`.

- [ ] **Step 1: Expose final-line and finish callbacks in the page mock**

Replace scope/event-ID mocks with `reachLastLine`, and update the player mock:

```tsx
const mocks = vi.hoisted(() => ({
  fetchCategories: vi.fn(),
  fetchLines: vi.fn(),
  fetchVocab: vi.fn(),
  fetchPractice: vi.fn(),
  getProgress: vi.fn(),
  saveProgress: vi.fn(),
  recordActivity: vi.fn(),
  reachLastLine: undefined as (() => void) | undefined,
  completeConversation: undefined as (() => void) | undefined,
}))

vi.mock("../lib/activity/recordLearningActivity", () => ({
  recordLearningActivity: mocks.recordActivity,
}))

vi.mock("../components/speak/ConversationPlayer", () => ({
  ConversationPlayer: ({ title, onComplete, onReachedLastLine }: {
    title: string
    onComplete: () => void
    onReachedLastLine: () => void
  }) => {
    mocks.completeConversation = onComplete
    mocks.reachLastLine = onReachedLastLine
    return (
      <div>
        <span>{title}</span>
        <button type="button" onClick={onReachedLastLine}>Reach last line</button>
        <button type="button" onClick={onComplete}>Finish conversation</button>
      </div>
    )
  },
}))
```

- [ ] **Step 2: Write failing page integration tests**

Add the first-time and repeat contracts:

```tsx
it("persists first-time lesson state before recording the final-line event", async () => {
  const user = await openConversation()
  await user.click(screen.getByRole("button", { name: "Reach last line" }))

  expect(mocks.saveProgress).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ completedConversations: ["conversation-1"] }),
  )
  expect(mocks.recordActivity).toHaveBeenCalledExactlyOnceWith({
    kind: "conversation_completed",
    mode: "speak",
    entityId: "conversation-1",
  })
  expect(mocks.saveProgress.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.recordActivity.mock.invocationCallOrder[0],
  )
})

it("records a repeated lesson without rewriting unique lesson state", async () => {
  mocks.getProgress.mockReturnValue(progress(["conversation-1"]))
  const user = await openConversation()
  await user.click(screen.getByRole("button", { name: "Reach last line" }))

  expect(mocks.saveProgress).not.toHaveBeenCalled()
  expect(mocks.recordActivity).toHaveBeenCalledExactlyOnceWith({
    kind: "conversation_completed",
    mode: "speak",
    entityId: "conversation-1",
  })
})

it("does not record again when Finish follows the final-line event", async () => {
  const user = await openConversation()
  await user.click(screen.getByRole("button", { name: "Reach last line" }))
  await user.click(screen.getByRole("button", { name: "Finish conversation" }))

  expect(mocks.recordActivity).toHaveBeenCalledTimes(1)
  expect(screen.getByText("Practice view")).toBeInTheDocument()
})
```

Retain the storage-failure contract but invoke `mocks.reachLastLine?.()` and expect no activity event.

- [ ] **Step 3: Run RED page test**

Run: `npx vitest run src/pages/SpeakModePage.activity.test.tsx --maxWorkers=1`

Expected: FAIL because no final-line prop is wired, repeats are suppressed, and Finish still records a deterministic event.

- [ ] **Step 4: Implement recording/navigation separation**

Reduce the import to:

```ts
import { recordLearningActivity } from "../lib/activity/recordLearningActivity"
```

Replace completion recording with:

```ts
const recordConversationCompletion = (conversationId: string) => {
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
  }

  recordLearningActivity({
    kind: "conversation_completed",
    mode: "speak",
    entityId: conversationId,
  })
}
```

Remove the recording call from `handleConversationComplete` and wire:

```tsx
<ConversationPlayer
  title={activeConversationTitle}
  lines={activeLines}
  onReachedLastLine={() => recordConversationCompletion(selectedConversationId)}
  onComplete={handleConversationComplete}
/>
```

Keep `InteractivePracticePlayer.onComplete={handleConversationComplete}` so practice cannot add a second listening event.

- [ ] **Step 5: Run GREEN page and recorder tests**

Run: `npx vitest run src/pages/SpeakModePage.activity.test.tsx src/lib/activity/recordLearningActivity.test.ts --maxWorkers=1`

Expected: all tests PASS; the page calls the recorder without a deterministic ID and the recorder continues to preserve distinct generated events.

- [ ] **Step 6: Commit Task 3**

```bash
git diff -- src/pages/SpeakModePage.tsx src/pages/SpeakModePage.activity.test.tsx
git add -p -- src/pages/SpeakModePage.tsx
git add -- src/pages/SpeakModePage.activity.test.tsx
git diff --cached --check
git diff --cached
git commit -m "feat: record completed conversation rounds"
```

Expected: cached content contains only final-line wiring, navigation separation, and matching tests.

### Task 4: Full Verification

**Files:**
- Verify only; no planned source edits.

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: fresh regression evidence.

- [ ] **Step 1: Run focused tests**

```bash
npx vitest run src/lib/activity/activitySummary.test.ts src/lib/activity/recordLearningActivity.test.ts src/components/speak/ConversationPlayer.activity.test.tsx src/pages/SpeakModePage.activity.test.tsx src/pages/HomePage.test.tsx --maxWorkers=1
```

Expected: all focused files PASS with zero unhandled errors.

- [ ] **Step 2: Lint every feature file**

```bash
npx eslint src/lib/activity/activitySummary.ts src/lib/activity/activitySummary.test.ts src/components/speak/ConversationPlayer.tsx src/components/speak/ConversationPlayer.activity.test.tsx src/pages/SpeakModePage.tsx src/pages/SpeakModePage.activity.test.tsx src/pages/HomePage.test.tsx --max-warnings=0
```

Expected: exit code `0`, zero warnings, zero errors.

- [ ] **Step 3: Run the complete suite**

Run: `npm test`

Expected: exit code `0`, zero failed tests, zero unhandled errors.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite both exit `0`.

- [ ] **Step 5: Check whitespace and scope**

```bash
git diff --check
git status --short
git log -3 --oneline
```

Expected: no whitespace errors and no accidental files. Report exact test counts, lint/build outcomes, and pre-existing unrelated dirty files.
