# Project: Vocabulary Notes and Tips Generation

## Architecture
- `src/data/vocabulary-2000.json`: Main data file containing 2,000 vocabulary words with CEFR categories and metadata.
- `scripts/generateUsageNotes.js`: Existing draft script for generating usage notes using Gemini.
- `scripts/validateUsageNotes.js`: [Planned] Validation script to programmatically verify completeness and diversity.
- `scripts/evaluateUsageNotes.js`: [Planned] Quality evaluation script/harness for Judge evaluator agent.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Exploration & Analysis | Count existing usage notes, check API and file structure | None | DONE |
| 2 | Generation Script Refactoring & Execution | Update script to process in safe batches of 100, run API generation | M1 | IN_PROGRESS |
| 3 | Validation Script Implementation & Verification | Write validation script, verify 2,000 completeness and diversity | M2 | IN_PROGRESS |
| 4 | Judge Quality Evaluation | Spawn Judge agent to sample 50 words and verify quality | M3 | PLANNED |
| 5 | Forensic Integrity Audit | Verify there is no cheating or hardcoding in validation/results | M4 | PLANNED |
| 6 | Final Review & Handoff | Synthesize findings and report to Sentinel | M5 | PLANNED |

## Interface Contracts
### vocabulary-2000.json format
Each vocabulary word is an object containing:
- `id`: string (e.g. `"word_a1_0001"`)
- `word`: string (e.g. `"actor"`)
- `usageNotes`: object containing:
  - `howToUse`: string (Thai)
  - `commonSituation`: string (Thai)
  - `formality`: string (Thai/English)
  - `warning`: string (Thai)
  - `thaiLearnerTip`: string (Thai)
All fields in `usageNotes` must be present and contain word-specific, context-aware guidance.

## Code Layout
- `src/data/vocabulary-2000.json` (vocabulary data)
- `scripts/` (utility/generation scripts)
