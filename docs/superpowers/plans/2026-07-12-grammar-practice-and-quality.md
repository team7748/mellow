# Grammar Practice and Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable JSON-driven grammar practice, accurately record lesson completion, add linting, and remove the vocabulary bundle warning.

**Architecture:** A grammar practice view receives an already-loaded `GrammarTopic`, evaluates declared answers locally, and returns a completion result only after every question is attempted. `GrammarLessonPage` owns lesson/practice view state and delegates persistence to the existing grammar progress repository. Vite manual chunks isolate vocabulary data from the application entry.

**Tech Stack:** React 19, TypeScript, Vitest, Vite, ESLint flat config.

## Global Constraints

- Reuse `loadGrammarTopic` and the existing `SpeakButton`/speech utility.
- Do not hardcode tense content or create twelve pages.
- Reading a lesson must never mark it completed or mastered.
- Completion requires all loaded practice questions to be attempted.

---

### Task 1: Add lint command

**Files:** `package.json`, `eslint.config.js`

- [ ] Add ESLint and the React hooks plugin as development dependencies, create an ESLint flat config for TypeScript/TSX, and add `npm run lint`.
- [ ] Run `npm run lint` and resolve errors in files changed by this feature.

### Task 2: Build JSON-driven grammar practice

**Files:** `src/components/grammar/GrammarPractice.tsx`, `src/components/grammar/GrammarPractice.test.tsx`, `src/pages/GrammarLessonPage.tsx`

- [ ] Write failing tests for a multiple-choice answer, written-answer normalization, and all-questions completion.
- [ ] Render declared choices as buttons; render all other audited question types as normalized text input; show the JSON explanation and call the existing audio control for English prompts.
- [ ] Advance after an answer or skip, then return correct/attempted counts to the lesson page.
- [ ] Change Start Practice to an active route-state action and persist `lessonCompleted` only when every question was attempted.

### Task 3: Split vocabulary bundle

**Files:** `vite.config.ts`

- [ ] Add stable manual chunks for vocabulary data and grammar source modules.
- [ ] Run a production build and confirm the prior vocabulary warning is absent.

### Task 4: Verify

- [ ] Run grammar data tests, grammar UI tests, lint, typecheck/build, and `git diff --check` for changed paths.
