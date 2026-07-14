# Review Flashcard Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Flashcard Mode that reviews due `learning` and `review` words from `src/data/vocabulary.json` and saves recall results in LocalStorage.

**Architecture:** Add a focused `FlashcardPage` that reads words through `getReviewWords()` and writes answers through `updateWordProgress()`. Wire it into the existing in-memory app navigation with a new `flashcard` page value and point the existing practice nav item to it.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, existing LocalStorage progress utilities.

---

### Task 1: Flashcard Page Behavior

**Files:**
- Create: `src/pages/FlashcardPage.tsx`
- Test: `src/pages/FlashcardPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Test these behaviors:
- Empty review queue shows a helpful empty state.
- A due review word shows its English front.
- Pressing the flip button reveals Thai meaning, IPA, and example when present.
- Pressing `จำได้` stores a correct result in LocalStorage and advances.
- Pressing `ยังจำไม่ได้` stores an incorrect result in LocalStorage and advances.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/pages/FlashcardPage.test.tsx`

Expected: FAIL because `FlashcardPage` does not exist yet.

- [ ] **Step 3: Implement the page**

Create `FlashcardPage` with state for current card index, flipped state, and answered count. Use `getReviewWords()` as the card source, render only the English word before flip, render Thai meaning, IPA, and example after flip, then call `updateWordProgress(word.id, true | false)` from the two answer buttons.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm test -- src/pages/FlashcardPage.test.tsx`

Expected: PASS.

### Task 2: App Navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Navigation.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write failing app navigation test**

Add a test that clicks the practice nav item and expects the Flashcard page heading.

- [ ] **Step 2: Run app test to verify RED**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because `flashcard` is not wired into `AppPage`.

- [ ] **Step 3: Implement route and nav**

Add `flashcard` to `AppPage`, import `FlashcardPage`, render it for the flashcard page, and change the existing practice nav item from `home` to `flashcard`.

- [ ] **Step 4: Run app test to verify GREEN**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

### Task 3: Documentation and Verification

**Files:**
- Modify: `docs/FEATURES.md`
- Modify: `docs/UI_GUIDE.md`
- Modify: `docs/STEP_LOG.md`

- [ ] **Step 1: Update docs**

Document that Flashcard Mode reviews due words, supports flip-to-answer, and stores answers in LocalStorage.

- [ ] **Step 2: Run full verification**

Run: `npm test`

Expected: all tests pass.

Run: `npm run build`

Expected: TypeScript and Vite production build pass.
