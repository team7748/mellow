# Grammar Mode specification

## Overview

Grammar Mode is a proposed learning area for the existing Speak Mode. It will expose
the twelve supplied tense topics, beginning with Present Simple and ordered by their
existing `displayOrder`. This document is a plan, not an implementation.

## Current system findings

- The React/Vite app uses hash routing in `src/App.tsx`; Speak Mode is `#speak`.
- `src/pages/SpeakModePage.tsx` is a stateful single-page flow: category selection,
  then conversation/practice. It currently loads four conversation CSV files through
  `src/utils/conversationData.ts`.
- `src/components/speak/CategorySelector.tsx` renders conversation categories as
  cards. Grammar does not yet exist in that data source or UI.
- Speak progress uses the separate `speakModeProgress` LocalStorage key.
- Vocabulary progress uses `thai-english-vocab-progress`; flashcards use the
  existing vocabulary/SRS stack. Authentication/profile services use Supabase, but
  the observed Grammar data has no persistence integration.
- Browser speech is available through the shared SpeakButton/Web Speech API; it is
  not an audio asset pipeline.
- The project has Vitest (`npm test`) and `npm run build`; no grammar validator or
  grammar tests were found.

## Goals

- Put Grammar first in the Speak Mode category selection, above existing scenarios.
- Present a grammar topic list and lessons based only on the supplied JSON data.
- Use `stage`, `difficulty`, `displayOrder`, and `prerequisites`; do not introduce
  CEFR for Grammar Mode.
- Keep learner progress, mistakes, flashcard scheduling, and content separate.
- Support responsive, accessible, dark-mode-compatible learning flows.

## Non-goals

- No new bottom-navigation item.
- No change to the current Speak, vocabulary, flashcard, progress, or JSON behavior
  in this documentation pass.
- No invented grammar content, fabricated AI feedback, or content edits to make UI
  implementation easier.

## User flow

1. Learner opens Speak Mode (`#speak`).
2. Grammar appears as the first category card.
3. Learner opens the grammar topic list, ordered by `displayOrder` and grouped by
   `categoryId` (present, past, future).
4. Learner opens a topic lesson, studies explanations/examples, listens on demand,
   then practises.
5. Answer results update independent grammar progress and, where applicable,
   mistakes and flashcard/SRS records.
6. Learner can return to the list or resume later without altering source JSON.

## Grammar placement in Speak Mode

Grammar is a peer of Morning Routine, Customer Service, Job Interview, Daily Life,
and other scenarios—not a navigation destination. The future category adapter should
prepend a stable Grammar category definition at the selector boundary and preserve
the existing conversation category ordering unchanged.

## Information architecture

```text
Speak Mode
├─ Grammar (first category)
│  ├─ Present / Past / Future topic groups
│  ├─ Grammar lesson
│  ├─ Practice
│  └─ Grammar flashcard review
└─ Existing conversation categories and practice
```

## Proposed routes

The current application only recognizes whole-page hash routes. A future change
should preserve `#speak` and encode Grammar subviews either as a supported hash
parameter (`#speak?view=grammar&topic=<id>`) or through a router migration. The
choice must be made during implementation; neither route exists today. Direct URL,
refresh, back, and forward behavior are acceptance requirements.

## Page structure and component architecture

Proposed units, to be created only in a future implementation:

- `GrammarCategoryCard`: entry point rendered before conversation cards.
- `GrammarTopicList`: registry-driven grouping, prerequisites, and progress summary.
- `GrammarLessonPage`: renders declared lesson sections from a loaded topic.
- `GrammarPracticePlayer` and answer-checking service: render question type and
  return an explainable evaluation result.
- `grammarRegistry`, `grammarLoader`, and schema validator: isolate source lookup,
  ordering, validation, and errors from React components.
- Grammar progress/mistake/SRS repositories: isolate mutable learner state from
  immutable source content.

## Data and answer-checking flow

The future registry enumerates stable topic IDs and source file locations. The loader
lazy-loads a requested topic, validates it, and returns a typed result. The UI renders
only that result. Practice answer checking should normalize harmless punctuation,
capitalization, and contractions where the question permits; open answers must not
use exact-string equality alone. A result includes correctness, correction when
available, explanation, and related topic reference. AI feedback is allowed only
when an actual AI-backed service is configured.

## Progress, flashcard, and SRS flow

Grammar progress keys must reference stable topic/question/card IDs, never mutate
JSON. A separate namespace records attempts, completion, accuracy, mistakes, and
review state. Grammar flashcards should reuse an adapter to the established SRS
concepts (Again/Hard/Good/Easy) without mixing vocabulary and grammar identifiers.
Guest LocalStorage state and authenticated persistence require explicit migration and
ownership rules before any Supabase write is added.

## Loading, empty, and error states

- Loading: show an accessible status while a category or topic loads.
- Empty: explain that no eligible topics are available and offer return to Speak.
- Error: retain navigation, show a concise retry action, and do not expose internal
  parse or server details. A malformed topic must not crash the rest of Speak Mode.

## Mobile requirements and accessibility

Use the existing mobile-first card layout, one-column topic/lesson flow, readable
Thai guidance, touch targets, keyboard-visible focus, semantic headings, labelled
controls, status announcements, non-color-only correctness signals, reduced motion,
and existing dark-mode tokens. Do not rely on wide tables on mobile.

## Security considerations

Treat JSON as public content only; do not store user data in it. Validate fetched or
imported data before rendering. Sanitize user-entered answers before display, avoid
unnecessary HTML injection, protect authenticated grammar progress with Supabase RLS
before persistence, and keep client error messages non-sensitive.

## Acceptance criteria

- Grammar is first in Speak Mode and existing categories remain available.
- The list contains all valid registered tense topics in display order.
- Lessons, practice, flashcards, and progress read the registry/content state rather
  than hardcoded duplicated grammar text.
- Invalid/missing data fails locally with a recoverable UI state.
- Grammar does not become a bottom-navigation item and does not introduce CEFR.
- Desktop, tablet, mobile, keyboard, screen-reader, dark-mode, guest, and auth
  behavior have automated or documented manual coverage before release.
