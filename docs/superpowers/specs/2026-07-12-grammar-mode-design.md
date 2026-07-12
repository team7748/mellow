# Grammar Mode documentation design

## Scope

This is a documentation-only discovery pass. It records the current application and
the proposed, separate Grammar Mode architecture. It does not modify application
code, routing, UI, or grammar JSON content.

## Chosen approach

Use an as-is audit plus target architecture. Each document distinguishes observed
facts from future proposals so that missing fields and absent integrations are not
mistaken for implemented functionality.

## Design

- Keep the twelve source JSON files as the future content source of truth.
- Add a dedicated registry and loader only in a later implementation phase; do not
  make components duplicate topic metadata or content.
- Keep Grammar as the first category within Speak Mode, not a new bottom-navigation
  destination.
- Give grammar progress, mistakes, and SRS records their own user-state storage;
  content JSON remains immutable and contains no learner progress.
- Preserve existing Speak conversation CSV loading, vocabulary progress, hash
  routing, Web Speech API use, and the existing Supabase auth/profile boundary.

## Known gap

The supplied JSON files are at the repository root, not `src/data/grammar/topics/`.
They expose `id` and `name` rather than `topicId` and `title`, and do not currently
expose `schemaVersion`, `contentVersion`, or `status`. The documentation treats
these as audit findings and migration requirements, not values to invent.

## Verification

The inventory is generated from successful parsing and field counts of all twelve
root-level tense JSON files. Documentation review checks that no product file is
modified.
