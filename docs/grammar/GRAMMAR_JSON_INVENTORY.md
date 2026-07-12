# Grammar JSON inventory

## Audit method

All twelve root-level JSON files parsed successfully with PowerShell `ConvertFrom-Json`.
No files were edited. Counts below describe the actual observed top-level arrays;
`practice` is the observed source for practice questions and `flashcards` is the
observed source for flashcards.

## Location and schema finding

The files are at the repository root, not the expected
`src/data/grammar/topics/` location. Observed identifiers use `id`, `name`, and
`nameThai`; `topicId`, `title`, `schemaVersion`, `contentVersion`, and `status` are
absent in all twelve files. The table reports those requested fields as **missing**
rather than synthesizing values. The source uses `uses` rather than `useCases`,
`structures` rather than `rules`, and `commonMistakes` rather than `mistakes`.

| File | `id` (topic ID) | Category | Title | Stage / difficulty | Order | Prerequisites | Minutes | Objectives | Uses | Examples | Structures | Mistakes | Flashcards | Practice | Production questions | schema/content/status |
| --- | --- | --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `present-simple.json` | `topic-present-simple` | present | Present Simple | beginner / 1 | 1 | — | 20 | 6 | 4 | 10 | 7 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `present-continuous.json` | `topic-present-continuous` | present | Present Continuous | beginner / 1 | 2 | `topic-present-simple` | 20 | 6 | 4 | 10 | 7 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `present-perfect.json` | `topic-present-perfect` | present | Present Perfect | elementary / 3 | 3 | `topic-present-simple`, `topic-past-simple` | 25 | 9 | 5 | 10 | 7 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `present-perfect-continuous.json` | `topic-present-perfect-continuous` | present | Present Perfect Continuous | intermediate / 4 | 4 | `topic-present-perfect`, `topic-present-continuous` | 25 | 8 | 4 | 10 | 8 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `past-simple.json` | `topic-past-simple` | past | Past Simple | beginner / 2 | 5 | `topic-present-simple` | 20 | 9 | 4 | 10 | 7 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `past-continuous.json` | `topic-past-continuous` | past | Past Continuous | elementary / 3 | 6 | `topic-past-simple`, `topic-present-continuous` | 20 | 8 | 4 | 10 | 8 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `past-perfect.json` | `topic-past-perfect` | past | Past Perfect | intermediate / 4 | 7 | `topic-past-simple`, `topic-present-perfect` | 25 | 8 | 4 | 10 | 6 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `past-perfect-continuous.json` | `topic-past-perfect-continuous` | past | Past Perfect Continuous | intermediate / 5 | 8 | `topic-past-perfect`, `topic-past-continuous` | 25 | 8 | 4 | 10 | 6 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `future-simple.json` | `topic-future-simple` | future | Future Simple | beginner / 2 | 9 | `topic-present-simple` | 20 | 9 | 5 | 10 | 6 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `future-continuous.json` | `topic-future-continuous` | future | Future Continuous | elementary / 3 | 10 | `topic-future-simple`, `topic-present-continuous` | 20 | 8 | 4 | 10 | 6 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `future-perfect.json` | `topic-future-perfect` | future | Future Perfect | intermediate / 4 | 11 | `topic-future-simple`, `topic-present-perfect` | 25 | 8 | 4 | 10 | 6 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |
| `future-perfect-continuous.json` | `topic-future-perfect-continuous` | future | Future Perfect Continuous | intermediate / 5 | 12 | `topic-future-perfect`, `topic-future-continuous` | 25 | 9 | 4 | 10 | 6 | 8 | 10 | 18 | Not separately identified | missing / missing / missing |

## Data status

- Syntax: all twelve files parse successfully in the audit tool used.
- IDs: the twelve observed root `id` values are distinct.
- Ordering: observed `displayOrder` is contiguous from 1 through 12.
- Prerequisites: present and expressed as topic IDs except Present Simple, which has
  no prerequisite field/value.
- Content separation: no user-progress field was observed at the root level.
- Schema readiness: version/status fields required by the requested target schema
  are missing; a formal validation/migration decision is required before release.
