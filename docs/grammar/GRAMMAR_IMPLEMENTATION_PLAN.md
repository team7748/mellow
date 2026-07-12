# Grammar implementation plan

This is a future plan only. File names labelled **proposed** do not exist today.

## 1. Data audit

- Goal: establish the exact source location, field contract, encodings, IDs, and
  prerequisite graph for all twelve files.
- Create: audit report and fixture snapshots (proposed).
- Modify: none initially.
- Dependencies: root-level tense JSON files.
- Acceptance/tests: all files parse; inventories and missing fields are reported,
  not silently repaired.
- Do not affect: source content, existing vocabulary/CSV data.

## 2. Schema and validation

- Goal: define legacy/target types and runtime/build validation.
- Create: `src/types/grammar.ts`, `src/data/grammar/schema.ts` (proposed).
- Modify: test configuration only if necessary.
- Dependencies: completed data audit.
- Acceptance/tests: duplicate IDs, broken prerequisites, invalid arrays, and absent
  required versions are reported deterministically.
- Do not affect: grammar JSON content or existing types.

## 3. Data loader and registry

- Goal: provide one registry and lazy topic loading.
- Create: `src/data/grammar/registry.ts`, `src/data/grammar/loader.ts` (proposed).
- Modify: none until a source-location decision is approved.
- Dependencies: validated schema and a confirmed JSON placement/migration strategy.
- Acceptance/tests: ordered summaries; one-topic load; cache; unknown-topic error.
- Do not affect: `src/utils/conversationData.ts` behavior.

## 4. Grammar category in Speak Mode

- Goal: present Grammar first while retaining all conversation cards.
- Create: grammar category adapter/card (proposed).
- Modify: `src/pages/SpeakModePage.tsx`, `src/components/speak/CategorySelector.tsx`.
- Dependencies: registry summaries and route/view decision.
- Acceptance/tests: first placement, no bottom-navigation item, existing categories
  and resume behavior remain intact.
- Do not affect: conversation CSV content and selector ordering after Grammar.

## 5. Grammar topic listing

- Goal: list all validated topics grouped by present/past/future.
- Create: `src/components/grammar/GrammarTopicList.tsx` (proposed).
- Modify: proposed Speak grammar view.
- Dependencies: loader, progress read model.
- Acceptance/tests: 12 topics, display order, prerequisites, loading/empty/error.
- Do not affect: CEFR vocabulary filters.

## 6. Grammar lesson page

- Goal: render source-defined teaching sections and on-demand speech.
- Create: `src/components/grammar/GrammarLessonPage.tsx` (proposed).
- Modify: hash-route handling in `src/App.tsx` only after route approval.
- Dependencies: exact field adapters, `src/components/ui/SpeakButton.tsx`.
- Acceptance/tests: each supported source section renders from JSON; no hardcoded
  duplicated grammar text; invalid topic is recoverable.
- Do not affect: existing `#speak` conversation flow.

## 7. Practice engine

- Goal: render declared grammar question types.
- Create: grammar practice components/hooks (proposed).
- Modify: none outside grammar boundaries.
- Dependencies: field-level practice audit.
- Acceptance/tests: question-specific controls and keyboard support.
- Do not affect: vocabulary quiz semantics.

## 8. Answer checking

- Goal: provide explainable, tolerant answer evaluation.
- Create: grammar answer checker/service tests (proposed).
- Modify: optional shared evaluator only after compatibility review.
- Dependencies: question schemas and real AI service only if AI feedback is enabled.
- Acceptance/tests: normalization, valid alternatives, corrections, no exact-string
  judgement for open answers.
- Do not affect: current `api/speak-answer-check` contract without explicit review.

## 9. Progress and mistakes

- Goal: save independent grammar attempts, completion, and deduplicated mistakes.
- Create: grammar progress repository/types (proposed).
- Modify: Progress dashboard only after read-model acceptance.
- Dependencies: stable IDs and guest/auth ownership design.
- Acceptance/tests: refresh persistence, no cross-user leakage, no duplicate mistake
  from one answer.
- Do not affect: vocabulary and Speak LocalStorage keys.

## 10. Flashcard and SRS

- Goal: adapt source flashcards to a namespaced Grammar SRS model.
- Create: grammar flashcard adapter (proposed).
- Modify: `src/utils/srsService.ts` only after adapter contract review.
- Dependencies: card IDs and progress repository.
- Acceptance/tests: due calculation, Again/Hard/Good/Easy, no vocabulary ID collision.
- Do not affect: existing vocabulary card schedules.

## 11. Testing and audit

- Goal: verify functionality and regressions before release.
- Create: grammar unit/integration tests and data-audit script (proposed).
- Modify: CI scripts only if approved.
- Dependencies: phases 1–10.
- Acceptance/tests: checklist below passes; `npm test` and `npm run build` pass.
- Do not affect: unrelated refactors or content changes.
