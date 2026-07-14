# Flashcard Category Session Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start Flashcard sessions with every word matching a category or other non-custom filter while retaining the 50-word maximum for manually selected sessions.

**Architecture:** `useFlashcardSetup` remains the single source of session word ids. Its custom-selection branch retains its existing 50-word slice; its non-custom branch passes all `activeWords` to `buildSession`. The setup button derives its visible count from the same branch so the UI represents the actual session size.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library.

## Global Constraints

- Do not change the 50-word maximum for manual selection, including Select All.
- Do not change the `startRandom20Session()` 20-word shortcut.
- Do not change SRS sorting, vocabulary filters, or practice queue behavior.
- Do not add dependencies.

---

### Task 1: Protect category and manual session limits

**Files:**
- Modify: `src/hooks/useFlashcardSetup.test.tsx`
- Modify: `src/hooks/useFlashcardSetup.ts`
- Modify: `src/components/flashcard/FlashcardSetup.tsx`

**Interfaces:**
- Consumes: `activeWords`, `mode`, and `customSelectedIds` from `useFlashcardSetup`.
- Produces: `startSession(): string[]` with all non-custom ids and no more than 50 custom ids.

- [ ] **Step 1: Write failing tests**

```tsx
it("starts every filtered category word outside custom selection", () => {
  const { result } = renderHook(() => useFlashcardSetup())
  act(() => result.current.updateFilter("category", "Daily Life"))

  expect(result.current.startSession()).toHaveLength(result.current.activeWords.length)
  expect(result.current.activeWords.length).toBeGreaterThan(50)
})

it("keeps manual sessions capped at 50 words", () => {
  const { result } = renderHook(() => useFlashcardSetup())
  act(() => result.current.setMode("custom-selection"))
  act(() => result.current.selectAllCustomSelection())

  expect(result.current.startSession()).toHaveLength(50)
})
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `npm test -- src/hooks/useFlashcardSetup.test.tsx`

Expected: the category session assertion receives 50 ids because the non-custom path calls `activeWords.slice(0, 50)`.

- [ ] **Step 3: Write minimal implementation**

```ts
function startSession(): string[] {
  if (mode === "custom-selection") {
    return buildSession(customSelectedIds.slice(0, 50))
  }
  return buildSession(activeWords.map((word) => word.id))
}
```

Render `activeWords.length` rather than `Math.min(activeWords.length, 50)` in the non-custom start-button label.

- [ ] **Step 4: Run targeted test and build**

Run: `npm test -- src/hooks/useFlashcardSetup.test.tsx && npm run build`

Expected: all targeted assertions and the TypeScript/Vite build pass.
