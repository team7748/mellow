# Grammar Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typed, validated, lazy-loadable access to the twelve audited Grammar JSON topics without creating UI.

**Architecture:** A Grammar module owns legacy-source types, pure validation, one central registry of dynamic imports, and query helpers. The registry contains only stable metadata and loaders; it never duplicates lesson bodies. Validation returns structured errors rather than throwing at UI boundaries.

**Tech Stack:** React 19, TypeScript 5.7 strict mode, Vite 6 dynamic imports, Vitest 2.1. No new validation dependency.

## Global Constraints

- Do not create or modify Grammar UI, routes, progress, flashcards, or SRS behavior.
- Retain the 12 published root topic IDs and source JSON teaching content.
- Do not add CEFR data.
- Treat the current corpus as an explicit legacy schema: `id`/`name`/`uses`/`practice` are the supported source fields.
- Validate `stage`, `difficulty`, topic IDs, duplicate IDs, prerequisites, and multiple-choice answer/options.
- Keep topic content lazy; list APIs return registry summaries only.

---

### Task 1: Define legacy Grammar source contracts

**Files:**
- Create: `src/types/grammar.ts`
- Test: `src/types/grammar.test.ts`

**Consumes:** Audited root JSON fields and allowed question types.

**Produces:** `GrammarTopic`, `GrammarTopicSummary`, `GrammarPracticeQuestion`, `GrammarFlashcard`, `GrammarValidationIssue`, and `GrammarLoadResult` types used by all data-layer modules.

- [ ] **Step 1: Write the failing type/shape test**

```ts
import presentSimple from "../../present-simple.json"
import type { GrammarTopic } from "./grammar"

it("accepts the audited Present Simple source shape", () => {
  const topic: GrammarTopic = presentSimple
  expect(topic.id).toBe("topic-present-simple")
  expect(topic.practice[0].type).toBe("multiple_choice")
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/types/grammar.test.ts`

Expected: Type/module failure because `src/types/grammar.ts` does not exist.

- [ ] **Step 3: Implement the minimal source types**

```ts
export const grammarStages = ["foundation", "beginner", "elementary", "intermediate"] as const
export const grammarQuestionTypes = ["multiple_choice", "correct_or_incorrect", "choose_correct_sentence", "fill_blank", "sentence_builder", "correct_sentence", "find_mistake", "thai_to_english", "open_answer"] as const

export type GrammarStage = (typeof grammarStages)[number]
export type GrammarQuestionType = (typeof grammarQuestionTypes)[number]
export type GrammarTopic = {
  id: string; categoryId: "present" | "past" | "future"; name: string; nameThai: string
  slug: string; stage: GrammarStage; difficulty: 1 | 2 | 3 | 4 | 5; displayOrder: number
  estimatedMinutes: number; prerequisites: string[]; summary: { en: string; th: string }
  learningObjectives: string[]; uses: unknown[]; structures: unknown[]; timeMarkers: unknown[]
  examples: Array<{ id: string; sentence: string; translation: string }>
  commonMistakes: Array<{ id: string; incorrect: string; correct: string }>
  comparisons: Array<{ id: string }>; flashcards: GrammarFlashcard[]; practice: GrammarPracticeQuestion[]
}
```

Define `GrammarFlashcard` and `GrammarPracticeQuestion` with their observed required fields; do not use `any`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/types/grammar.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/types/grammar.ts src/types/grammar.test.ts
git commit -m "feat: add grammar source types"
```

### Task 2: Add pure schema and cross-topic validation

**Files:**
- Create: `src/data/grammar/validation.ts`
- Create: `src/data/grammar/validation.test.ts`

**Consumes:** Task 1 types and a `ReadonlyArray<GrammarTopic>`.

**Produces:** `validateGrammarTopic(topic)` and `validateGrammarCorpus(topics)` returning `GrammarValidationIssue[]`.

- [ ] **Step 1: Write failing validation tests**

```ts
it("reports an unknown prerequisite", () => {
  const result = validateGrammarCorpus([{ ...presentSimple, prerequisites: ["missing-topic"] }])
  expect(result).toContainEqual(expect.objectContaining({ code: "unknown_prerequisite" }))
})

it("reports a multiple-choice answer absent from options", () => {
  const result = validateGrammarTopic({ ...presentSimple, practice: [{ ...presentSimple.practice[0], answer: "missing" }] })
  expect(result).toContainEqual(expect.objectContaining({ code: "answer_not_in_options" }))
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/data/grammar/validation.test.ts`

Expected: FAIL because the validation module is absent.

- [ ] **Step 3: Implement validation**

Validate required legacy fields, `grammarStages`, integer difficulty 1–5, non-empty IDs,
duplicate topic/record IDs, unique display order, prerequisite targets, and answer/options
only for `multiple_choice`. Return issue records with `code`, `topicId`, `path`, and `message`.
Do not require absent target-schema fields (`schemaVersion`, rules, production questions).

- [ ] **Step 4: Run focused tests and corpus validation**

Run: `npm test -- src/data/grammar/validation.test.ts`

Expected: PASS.

Add a test importing all twelve source files and expect `validateGrammarCorpus(topics)` to equal `[]`.

- [ ] **Step 5: Commit**

```powershell
git add src/data/grammar/validation.ts src/data/grammar/validation.test.ts
git commit -m "feat: validate grammar data"
```

### Task 3: Central registry and lazy loader

**Files:**
- Create: `src/data/grammar/registry.ts`
- Create: `src/data/grammar/loader.ts`
- Create: `src/data/grammar/loader.test.ts`

**Consumes:** Task 1 types and Task 2 validation.

**Produces:** `getGrammarTopics()`, `getGrammarTopicSummary(topicId)`, `loadGrammarTopic(topicId)`, `getGrammarTopicsByCategory(categoryId)`, `getNextGrammarTopic(topicId)`, and `getPreviousGrammarTopic(topicId)`.

- [ ] **Step 1: Write failing loader tests**

```ts
it("lists twelve summaries in display order without lesson bodies", () => {
  expect(getGrammarTopics().map((topic) => topic.id)).toEqual([
    "topic-present-simple", "topic-present-continuous", "topic-present-perfect",
    "topic-present-perfect-continuous", "topic-past-simple", "topic-past-continuous",
    "topic-past-perfect", "topic-past-perfect-continuous", "topic-future-simple",
    "topic-future-continuous", "topic-future-perfect", "topic-future-perfect-continuous",
  ])
})

it("returns a controlled error for an unknown topic", async () => {
  await expect(loadGrammarTopic("missing")).resolves.toEqual({ ok: false, error: "topic_not_found" })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/data/grammar/loader.test.ts`

Expected: FAIL because registry/loader modules are absent.

- [ ] **Step 3: Implement registry and loader**

Use one `grammarTopicRegistry` array with the topic ID, category, order, display metadata,
and `loader: () => import("../../../present-simple.json")`-style functions. Keep the
metadata source-controlled and duplicate no lesson arrays. `loadGrammarTopic` invokes one
loader, validates the loaded module default, and returns `{ ok: true, topic }` or a
controlled `GrammarLoadResult` error; cache validated topics by ID.

- [ ] **Step 4: Run focused loader tests**

Run: `npm test -- src/data/grammar/loader.test.ts`

Expected: PASS, including sorted list, category grouping, next/previous boundaries,
unknown-topic error, and one-topic validation failure fixture.

- [ ] **Step 5: Commit**

```powershell
git add src/data/grammar/registry.ts src/data/grammar/loader.ts src/data/grammar/loader.test.ts
git commit -m "feat: add grammar topic loader"
```

### Task 4: Expose repeatable data checks

**Files:**
- Create: `scripts/validate-grammar-data.mjs`
- Modify: `package.json`
- Test: `src/data/grammar/validation.test.ts`

**Consumes:** Registry, loader, and validation from Tasks 2–3.

**Produces:** `npm run grammar:validate`, `npm run grammar:check-ids`,
`npm run grammar:check-references`, and `npm run grammar:test-data`.

- [ ] **Step 1: Write a failing script invocation test**

```ts
it("accepts the complete registered corpus", async () => {
  const topics = await Promise.all(getGrammarTopics().map(({ id }) => loadGrammarTopic(id)))
  expect(topics.every((result) => result.ok)).toBe(true)
})
```

- [ ] **Step 2: Run it to verify the missing command/module failure**

Run: `npm run grammar:validate`

Expected: FAIL because the script is absent.

- [ ] **Step 3: Implement the script and package commands**

The script loads registry topics, prints each validation issue as
`<topicId> <path> <code> <message>`, and exits 1 on any issue. Add these scripts:

```json
"grammar:validate": "node scripts/validate-grammar-data.mjs",
"grammar:check-ids": "node scripts/validate-grammar-data.mjs --ids",
"grammar:check-references": "node scripts/validate-grammar-data.mjs --references",
"grammar:test-data": "vitest run src/data/grammar"
```

- [ ] **Step 4: Verify scripts, full tests, and build**

Run: `npm run grammar:validate; npm run grammar:check-ids; npm run grammar:check-references; npm run grammar:test-data; npm test; npm run build`

Expected: every command exits 0.

- [ ] **Step 5: Commit**

```powershell
git add scripts/validate-grammar-data.mjs package.json src/data/grammar/validation.test.ts
git commit -m "chore: add grammar data checks"
```

## Self-review

- Prompt 4 coverage: types (Task 1), runtime/cross-file validation (Task 2), central registry and lazy loader (Task 3), commands and tests (Task 4).
- Deliberately excluded: UI, routing, progress, content migration, CEFR, and target fields that have no source equivalent.
- Type consistency: all later tasks consume `GrammarTopic`, `GrammarTopicSummary`, `GrammarLoadResult`, and validation APIs defined in Tasks 1–2.
