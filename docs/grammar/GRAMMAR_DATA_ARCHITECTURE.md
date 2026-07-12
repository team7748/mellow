# Grammar data architecture

## JSON source of truth

The twelve existing tense JSON files are the sole future source for grammar teaching
content. Components must not copy grammar prose, examples, rules, questions, or
flashcards. Learner state must never be written into these files.

## Topic registry and stable IDs

Create a typed registry in a future phase with one record per observed root `id`:
source path, `categoryId`, `name`, `nameThai`, `stage`, `difficulty`,
`displayOrder`, and prerequisites. Sort only by `displayOrder`; use the ID as the
stable reference for routes, progress, mistakes, and card ownership. The registry
must be the only central mapping from topic ID to loader path.

## TypeScript types

Define an explicit `GrammarTopic` matching the observed schema and narrow subtypes
for examples, structures, practice, and flashcards after a field-level audit.
Define a separate `GrammarTopicSummary` for lists and `GrammarProgress` for mutable
user state. Do not relabel `id`/`name` as `topicId`/`title` at runtime without a
documented compatibility adapter.

## Validation

- Runtime: validate loaded JSON, IDs, required display metadata, arrays, and
  prerequisite references before rendering a lesson; return a typed error result.
- Build time: parse all registry sources, verify unique IDs/slugs/orders, verify
  prerequisite targets, and report missing/unknown fields.
- Current gap: there is no validator in the repository. The current files lack
  `schemaVersion`, `contentVersion`, and `status`, so a validator must either support
  a documented legacy schema or block promotion until a content-owner migration.

## Data loader and lazy loading

The registry should expose summaries without importing all lesson bodies. A loader
retrieves one topic on demand, caches a validated result, and surfaces a retryable
error. This prevents loading the full grammar corpus just to render the Speak
category card or topic list.

## Error handling

Use a non-throwing result at the page boundary for unknown IDs, parse failures,
schema failures, duplicate registry entries, broken prerequisite references, or
network/module-load failure. Log technical context only in development; show users a
safe retry/back state.

## Versions and migration

Add schema/content versions only through a content migration approved by the data
owner. Until then, identify the source explicitly as legacy/unversioned. Migrations
must be deterministic, retain original stable IDs, and be tested with representative
files before moving files to `src/data/grammar/topics/`.

## Progress references

Grammar progress rows reference `topicId` (the stable source `id`), question/card
ID, attempt metadata, accuracy, and review due time. Use an independent namespace
and repository. A migration must neither overwrite `speakModeProgress` nor
`thai-english-vocab-progress`; authenticated records require user ownership and RLS.
