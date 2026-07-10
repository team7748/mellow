# Speak Mode Lesson Vocabulary Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the interactive answer-linked vocabulary strip with a simple lesson vocabulary list rendered as rows inside one shared panel.

**Architecture:** `VocabularyPanel` returns to a display/audio-only component that consumes only `vocabList`. `SpeakModePage` owns placement in the original desktop sidebar and mobile flow. `InteractivePracticePlayer` no longer receives vocabulary data or contains insertion, cursor, used-word, or vocabulary feedback state.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, React Testing Library, lucide-react.

## Global Constraints

- Use only `ConversationVocab.word` and `ConversationVocab.thaiMeaning`.
- Keep one shared `surface-card`; rows have no individual card background or shadow.
- Preserve existing speech settings and `SpeakButton` behavior.
- Do not connect vocabulary to the answer textarea.
- Preserve answer checking, navigation, progress, Guest/Auth Mode, and responsive behavior.

---

### Task 1: Define Lesson Vocabulary Rows behavior

**Files:**
- Modify: `src/components/speak/VocabularyPanel.test.tsx`
- Modify: `src/components/speak/VocabularyPanel.tsx`

- [ ] **Step 1: Write failing tests**

Assert that the panel renders `คำศัพท์ในบท`, a semantic list of rows, English/Thai text, and an independent audio button. Assert that no `เพิ่มคำแล้ว`, `กดที่คำ`, used check, or insert-word button exists.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run src/components/speak/VocabularyPanel.test.tsx`

Expected: FAIL because the current component still exposes interactive insertion props and editorial grid markup.

- [ ] **Step 3: Implement the minimal row panel**

Remove `onInsertWord` and `usedWords`. Render one `surface-card`, a compact header, and a `divide-y` list. Each row contains word/translation and the existing `SpeakButton` aligned right.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- --run src/components/speak/VocabularyPanel.test.tsx`

Expected: PASS.

### Task 2: Remove answer integration and restore placement

**Files:**
- Modify: `src/components/speak/InteractivePracticePlayer.test.tsx`
- Modify: `src/components/speak/InteractivePracticePlayer.tsx`
- Modify: `src/pages/SpeakModePage.tsx`

- [ ] **Step 1: Replace the insertion integration test**

Assert that `InteractivePracticePlayer` has no vocabulary prop/controls and preserves all answer-check tests.

- [ ] **Step 2: Remove integration code**

Delete `vocabList`, `vocabInsertMessage`, cursor insertion, used-word detection, and embedded `VocabularyPanel` from the practice player. Remove the `vocabList` prop passed by `SpeakModePage`.

- [ ] **Step 3: Restore the original panel placement**

Render `VocabularyPanel` in the desktop sidebar and mobile section for both conversation and practice views.

- [ ] **Step 4: Run Speak tests**

Run: `npx vitest run src/components/speak --reporter=dot`

Expected: all Speak tests pass.

### Task 3: Regression verification

**Files:**
- Verify only files changed in Tasks 1–2.

- [ ] **Step 1: Run full tests**

Run: `npm test -- --run --reporter=dot`

- [ ] **Step 2: Run production build**

Run: `npm run build`

- [ ] **Step 3: Inspect scoped diff**

Run: `git diff --check` and inspect the four Speak Mode files to ensure no insertion callback, capsule vocabulary button, or used state remains.
