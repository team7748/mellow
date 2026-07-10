# Speak Mode Horizontal Vocabulary Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Speak Mode vocabulary card list with a responsive, typographic vocabulary strip that inserts words into the practice answer without changing existing speech, checking, progress, auth, or navigation behavior.

**Architecture:** Keep `InteractivePracticePlayer` as the owner of answer text and textarea selection. Extend `VocabularyPanel` with optional insertion and used-word callbacks; when callbacks are absent it remains a display/audio-only panel for conversation view. Use the existing `SpeakButton` and existing color/type tokens, with a CSS Grid strip and thin inline separators.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, React Testing Library, lucide-react, Web Speech API wrapper.

## Global Constraints

- Use only `ConversationVocab.word` and `ConversationVocab.thaiMeaning`; do not invent missing IPA, part of speech, examples, or usage notes.
- Vocabulary items must have no card background, item border, shadow, rounded container, chip, badge, or default horizontal scroll.
- Desktop uses 4–6 columns, tablet 3–4, mobile 2, and very small screens 1.
- Preserve speech playback, speed setting, answer checking, retry, conversation switching, progress, Guest/Auth Mode, responsive layout, and Dark Mode where present.
- Use existing design tokens/classes (`text-leaf`, `text-ink`, `text-slate-*`) and existing `SpeakButton` behavior.

---

### Task 1: Define vocabulary strip behavior with tests

**Files:**
- Create: `src/components/speak/VocabularyPanel.test.tsx`
- Modify: `src/components/speak/VocabularyPanel.tsx` only after the tests fail

**Interfaces:**
- `VocabularyPanel` consumes `vocabList: ConversationVocab[]` plus optional `onInsertWord?: (word: string) => void` and `usedWords?: Set<string>`.
- Tests establish the public behavior for rendering, insertion callback, audio isolation, and used state.

- [ ] **Step 1: Write failing tests**

Cover these behaviors with React Testing Library:

```tsx
it("renders only available word and Thai meaning data", () => {
  render(<VocabularyPanel vocabList={[vocab("available", "ว่าง / พร้อม")]} />)
  expect(screen.getByRole("button", { name: /เพิ่มคำ available ว่าง \/ พร้อม/i })).toBeInTheDocument()
  expect(screen.queryByText(/IPA|adjective|example/i)).not.toBeInTheDocument()
})

it("calls onInsertWord when the vocabulary word is clicked", async () => {
  const onInsertWord = vi.fn()
  render(<VocabularyPanel vocabList={[vocab("confirm", "ยืนยัน")]} onInsertWord={onInsertWord} />)
  await userEvent.click(screen.getByRole("button", { name: /เพิ่มคำ confirm/i }))
  expect(onInsertWord).toHaveBeenCalledWith("confirm")
})

it("keeps the audio control separate from word insertion", async () => {
  const onInsertWord = vi.fn()
  render(<VocabularyPanel vocabList={[vocab("available", "ว่าง / พร้อม")]} onInsertWord={onInsertWord} />)
  await userEvent.click(screen.getByRole("button", { name: /ฟังเสียง available/i }))
  expect(onInsertWord).not.toHaveBeenCalled()
})

it("marks a used word with a small check without a badge", () => {
  render(<VocabularyPanel vocabList={[vocab("confirm", "ยืนยัน")]} usedWords={new Set(["confirm"])} />)
  expect(screen.getByText("✓")).toBeInTheDocument()
  expect(screen.queryByText(/badge/i)).not.toBeInTheDocument()
})
```

Use a local `vocab` helper with only the fields defined in `ConversationVocab`.

- [ ] **Step 2: Run the focused test and verify the expected RED failure**

Run: `npm test -- --run src/components/speak/VocabularyPanel.test.tsx`

Expected: FAIL because the optional insertion/used-word interface and new markup do not exist yet.

- [ ] **Step 3: Implement the minimal `VocabularyPanel` interface and markup**

Render a heading, instruction text, a `ul` grid, and each item as a borderless `button`. Render the existing `SpeakButton` inside a separate wrapper and stop propagation from its click event. Add only the current `word` and `thaiMeaning` fields, conditionally rendering non-empty values.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- --run src/components/speak/VocabularyPanel.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the isolated component behavior**

Run: `git add src/components/speak/VocabularyPanel.tsx src/components/speak/VocabularyPanel.test.tsx && git commit -m "feat: add horizontal Speak Mode vocabulary strip"`

### Task 2: Connect insertion to the practice textarea

**Files:**
- Modify: `src/components/speak/InteractivePracticePlayer.tsx`
- Modify: `src/components/speak/VocabularyPanel.tsx` if prop typing needs the finalized callback contract
- Modify: `src/components/speak/InteractivePracticePlayer.test.tsx` if present, otherwise create it

**Interfaces:**
- `InteractivePracticePlayer` passes `onInsertWord` and `usedWords` to `VocabularyPanel`.
- `onInsertWord(word)` updates the controlled `answer` and calls `setFeedback("เพิ่มคำแล้ว")`.

- [ ] **Step 1: Write failing integration tests**

Add tests that render `InteractivePracticePlayer` with one question and vocabulary data wired through the existing page boundary, or extract the smallest testable insertion helper if the current component does not receive vocab yet. Verify:

```tsx
it("inserts a vocabulary word at the textarea cursor and preserves existing text", async () => {
  render(<InteractivePracticePlayer categoryTitle="Daily" questions={[question]} vocabList={[vocab("confirm", "ยืนยัน")]} />)
  const textarea = screen.getByRole("textbox")
  await userEvent.type(textarea, "Please ")
  textarea.setSelectionRange(7, 7)
  await userEvent.click(screen.getByRole("button", { name: /เพิ่มคำ confirm/i }))
  expect(textarea).toHaveValue("Please confirm ")
  expect(screen.getByRole("status")).toHaveTextContent("เพิ่มคำแล้ว")
})
```

Also cover insertion into an empty answer and no duplicated spaces when the cursor is adjacent to whitespace.

- [ ] **Step 2: Run the focused integration test and verify RED**

Run: `npm test -- --run src/components/speak/InteractivePracticePlayer.test.tsx`

Expected: FAIL because the practice player does not yet accept/render the vocabulary list or cursor-aware insertion.

- [ ] **Step 3: Implement cursor-aware insertion**

Add a `textareaRef`, keep selection start/end in the callback, insert the word at the current selection, normalize only the boundary spaces, set the new answer, update `usedWords` from the resulting answer tokens, set the feedback status, and restore focus/selection after React updates. Keep `insertPhrase` unchanged unless it can safely reuse the same helper.

- [ ] **Step 4: Render the vocabulary strip in the practice answer area**

Pass the loaded practice vocabulary from `SpeakModePage` into `InteractivePracticePlayer` without changing the existing conversation-view panel. Keep the strip near the answer textarea so clicking a word inserts into the active answer.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run src/components/speak/VocabularyPanel.test.tsx src/components/speak/InteractivePracticePlayer.test.tsx`

Expected: PASS with no duplicate insertion or feedback regression.

### Task 3: Responsive, accessibility, and regression verification

**Files:**
- Modify: `src/components/speak/VocabularyPanel.tsx`
- Modify: `src/styles.css` only if a small shared animation/status rule is required
- Modify: tests from Tasks 1–2 as needed

- [ ] **Step 1: Add responsive and accessibility assertions**

Assert the vocabulary list uses responsive grid classes, each word has an accessible name, the audio button has its own accessible label, and empty vocab lists render nothing.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- --run src/components/speak/VocabularyPanel.test.tsx src/components/speak/InteractivePracticePlayer.test.tsx`

Expected: PASS.

- [ ] **Step 3: Run the full test suite**

Run: `npm test -- --run`

Expected: PASS; existing speech, quiz, navigation, and progress tests remain green.

- [ ] **Step 4: Run TypeScript/build verification**

Run: `npm run build`

Expected: successful Vite production build with no TypeScript errors.

- [ ] **Step 5: Inspect the final diff and commit the integration**

Run: `git diff --check; git diff -- src/components/speak/VocabularyPanel.tsx src/components/speak/InteractivePracticePlayer.tsx src/pages/SpeakModePage.tsx src/styles.css`

Then commit only the implementation/test files with: `git add src/components/speak/VocabularyPanel.tsx src/components/speak/VocabularyPanel.test.tsx src/components/speak/InteractivePracticePlayer.tsx src/components/speak/InteractivePracticePlayer.test.tsx src/pages/SpeakModePage.tsx src/styles.css && git commit -m "feat: connect Speak Mode vocabulary strip to answers"`
