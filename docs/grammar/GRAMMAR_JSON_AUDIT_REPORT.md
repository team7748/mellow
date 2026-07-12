# Grammar JSON audit report

## Scope and method

Audited the twelve root-level tense JSON files and all documents in `docs/grammar/`.
This is a data audit only: no JSON, UI, route, component, progress, or teaching
content was changed.

Checks performed:

- UTF-8 decoding, JSON parsing, and a duplicate-property parser using Python's
  `object_pairs_hook` for all 12 files.
- Root and nested schema inventory, allowed-value checks, IDs, prerequisites,
  comparison/practice structures, answer-option membership, and count checks.
- A targeted content spot-check of examples, corrections, and comparisons. It is not
  a substitute for an independent editorial review of every Thai/English sentence.

## Summary

| Check | Result |
| --- | --- |
| Syntax / UTF-8 / duplicate properties | Pass: 12/12 |
| Root topic IDs | Pass: 12 unique IDs |
| `displayOrder` | Pass: contiguous 1–12 |
| Multiple-choice answer in options | Pass: 72/72 |
| Target schema compatibility | Fail: legacy schema differs in every file |
| Stable cross-record references | Not implementable with current fields |
| CEFR field in grammar JSON | Not found |

## Critical issues

No syntax, decoding, duplicate-property, duplicate-ID, or multiple-choice
answer-option issue was found that would make a source file unreadable today.

## Major issues

### M-01 — All files use a legacy schema incompatible with the requested target contract

| Field | Detail |
| --- | --- |
| Files | `present-simple.json`, `present-continuous.json`, `present-perfect.json`, `present-perfect-continuous.json`, `past-simple.json`, `past-continuous.json`, `past-perfect.json`, `past-perfect-continuous.json`, `future-simple.json`, `future-continuous.json`, `future-perfect.json`, `future-perfect-continuous.json` |
| JSON path | `$` |
| ID | Each root `id` (for example `topic-present-simple`) |
| Problem | Every file lacks `schemaVersion`, `contentVersion`, `topicId`, `status`, `title`, `level`, `useCases`, `rules`, `practiceQuestions`, `productionQuestions`, `lessonSummary`, and `tags`. The current equivalents are `id`, `name`, `stage`, `difficulty`, `uses`, and `practice`; several target concepts have no equivalent. |
| Impact | A validator, registry, lesson renderer, progress model, and future API written to the target contract would reject all current files or require scattered special cases. |
| Recommended fix | Decide whether to formally adopt a legacy adapter or migrate content to the target schema in an approved content-migration step. Preserve the current `id` as the stable published identifier; do not edit automatically. |

### M-02 — Practice question type values do not match the allowed target enum

| Field | Detail |
| --- | --- |
| Files | All 12 grammar JSON files |
| JSON path | `$.practice[*].type` |
| ID | 216 existing `*-practice-*` IDs |
| Problem | Observed values are `multiple-choice` (72), `fill-blank` (60), `error-correction` (37), `reorder` (24), `tense-choice` (21), and `future-form-choice` (2). None uses the requested values such as `multiple_choice`, `fill_blank`, `correct_sentence`, or `sentence_builder`. |
| Impact | A strict target validator and question renderer cannot reliably dispatch every question. |
| Recommended fix | Approve a mapping table or migrate the field names/types in one controlled pass; do not infer a mapping inside components. |

### M-03 — Required stable reference model is absent

| Field | Detail |
| --- | --- |
| Files | All 12 grammar JSON files |
| JSON path | `$.learningObjectives`, `$.timeMarkers[*]`, `$.structures[*]`, `$.examples[*]`, `$.commonMistakes[*]`, `$.flashcards[*]`, `$.practice[*]` |
| ID | Not applicable for objective/time-marker records; pattern references are absent |
| Problem | Objectives are strings and time markers have no IDs. There is no `rules` collection, no `patternId`, no `exampleIds`, no `useCaseId`, and no `compareWithTopicId`. Existing `structures`, `examples`, and questions have IDs, but cannot form the required cross-record graph. |
| Impact | The requested broken-reference checks and traceable explanation/feedback links cannot be implemented against the source as-is. |
| Recommended fix | Define the smallest approved ID/reference extension or a versioned adapter before building validators, answer feedback, or SRS links. |

### M-04 — Flashcard and production-question target contracts are absent

| Field | Detail |
| --- | --- |
| Files | All 12 grammar JSON files |
| JSON path | `$.flashcards[*]`, `$.productionQuestions` |
| ID | 120 flashcard IDs; production question IDs absent |
| Problem | Flashcards expose only `id`, `front`, `back`, and `example`; no `cardType` is supplied. No `productionQuestions` collection exists. |
| Impact | The requested card-type validation and production-answer workflow cannot be built directly from the source. |
| Recommended fix | Obtain an approved content schema/migration decision before adding production practice or card-type-dependent UI. |

## Minor issues

### N-01 — Present Simple omits the required prerequisites field

| Field | Detail |
| --- | --- |
| File | `present-simple.json` |
| JSON path | `$.prerequisites` |
| ID | `topic-present-simple` |
| Problem | The field is absent; the other eleven files provide an array. |
| Impact | A strict required-field validator needs a special case. |
| Recommended fix | In an approved migration, represent no prerequisites consistently as `[]`. |

### N-02 — Three topics are below the requested time-marker count

| Field | Detail |
| --- | --- |
| Files | `past-simple.json`, `past-continuous.json`, `past-perfect.json` |
| JSON path | `$.timeMarkers` |
| ID | `topic-past-simple`, `topic-past-continuous`, `topic-past-perfect` |
| Problem | Each has 7 entries; the target range is 8–12. |
| Impact | They fail the target completeness specification, though they remain readable content. |
| Recommended fix | Have a content owner decide whether to add one marker per topic or revise the target range. |

### N-03 — Four practice questions repeat an accepted answer

| Field | Detail |
| --- | --- |
| Files / paths / IDs | `past-continuous.json` `$.practice[10].acceptedAnswers` `past-continuous-practice-11`; `past-perfect.json` `$.practice[9].acceptedAnswers` `past-perfect-practice-10`; `present-continuous.json` `$.practice[9].acceptedAnswers` `present-continuous-practice-10`; `present-simple.json` `$.practice[9].acceptedAnswers` `present-simple-practice-10` |
| Problem | The expected answer is repeated in `acceptedAnswers` (`While`, `By`, `Are`, and `Do` respectively). |
| Impact | No learner-visible correctness change is expected, but redundant values complicate normalization and validation. |
| Recommended fix | Remove only the duplicate entries after approval. |

### N-04 — Content counts differ from the requested target specification

| Field | Detail |
| --- | --- |
| Files | All 12 grammar JSON files |
| JSON path | `$.learningObjectives`, `$.uses`, `$.structures`, `$.commonMistakes` |
| ID | Each root topic ID |
| Problem | Objectives are 6–9 rather than 4; structures 6–8 rather than 4; common mistakes 8 rather than 5. `uses` is 5 (not 4) in Present Perfect and Future Simple. No rules or production questions are present. |
| Impact | A strict count validator would reject the corpus even though several collections contain more—not less—than the proposed target amount. |
| Recommended fix | Treat target counts as migration acceptance criteria only after the schema decision; do not delete teaching content merely to satisfy counts. |

## Content warnings

### C-01 — Full editorial linguistic validation remains outstanding

| Field | Detail |
| --- | --- |
| Files | All 12 grammar JSON files |
| JSON path | Teaching prose, examples, translations, corrections, and comparisons |
| ID | Various content records |
| Problem | Structural checks cannot establish that every English sentence is natural, every Thai translation is accurate, or every tense comparison is pedagogically complete. The targeted spot-check found no confirmed English/Thai correction requiring an automatic change. |
| Impact | Learner-facing wording may still require editorial review, especially advanced future-perfect-continuous examples. |
| Recommended fix | Schedule a human linguistic review before any content-editing prompt; record only confirmed corrections with their source IDs. |

## Notes on passing checks

- All 12 files are valid UTF-8 JSON with no duplicate properties detected by the
  duplicate-key parser.
- Root IDs plus IDs for uses, structures, examples, common mistakes, comparisons,
  flashcards, and practice questions are present and unique across the corpus.
- Every prerequisite value supplied by a dependent topic resolves to an existing root
  topic ID. Present Simple intentionally has no prerequisite value, but lacks the
  field required by the target contract.
- All 72 observed `multiple-choice` questions contain their `answer` in `options`.
- No CEFR field was found in the grammar source files.

## Audit conclusion

The content files are structurally readable and consistently named, but they are a
legacy schema rather than the target schema requested for Grammar Mode. Do not begin
the registry/UI phases with a strict target validator until the schema/adapter
decision is approved. No JSON file was modified by this audit.
