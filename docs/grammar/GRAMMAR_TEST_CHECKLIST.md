# Grammar test checklist (Implemented)

## Data and loading

- [x] All twelve JSON files parse as UTF-8 JSON; no duplicate IDs/slugs/orders.
- [x] Registry contains exactly the valid files and detects broken prerequisites.
- [x] Missing schema/content/status fields follow the approved legacy/migration rule.
- [x] Topic list lazy-loads summaries/content as designed and recovers from failure.

## Navigation and lessons

- [x] Grammar is first in Speak Mode; existing scenario cards still work.
- [x] Grammar is not a bottom-navigation item.
- [x] Direct URL, refresh, back, and forward behave correctly for proposed subviews.
- [x] All 12 topics group and order correctly; lesson sections render source content.
- [x] Loading, empty, and error states retain a usable return/retry route.

## Audio, practice, and answer checking

- [x] On-demand audio uses supported browser speech and never autoplays.
- [x] Each source question type gets the appropriate control and keyboard behavior via the Unified Flashcard system.
- [x] Correct, incorrect, contraction, capitalization, punctuation, and equivalent
  answers are evaluated according to the declared question type.
- [x] Open answers are not judged by exact string alone (utilizes Gemini AI evaluation).
- [x] Feedback includes only real evaluated data; no fabricated AI feedback.

## Progress, flashcards, and SRS

- [x] Progress saves before navigation and survives refresh.
- [x] Topic completion, accuracy, practice count, cards reviewed, and due reviews
  derive from actual grammar records.
- [x] Mistakes deduplicate a single response and reference a stable topic.
- [x] Grammar cards support Again/Hard/Good/Easy without vocabulary collisions.
- [x] Guest data uses a dedicated key (authenticated backend syncing is a Known Limitation currently relying entirely on LocalStorage).
- [x] Existing LocalStorage, Speak, vocabulary, and flashcard state is unchanged.

## Responsive, accessibility, theme, and regression

- [x] Test small iPhone/Android widths, tablet portrait/landscape, and desktop.
- [x] Test touch-only and keyboard-only flows; focus is visible and ordered.
- [x] Confirm semantic heading order, labels, screen-reader status, contrast, and
  non-color-only feedback.
- [x] Verify dark mode and reduced motion.
- [x] Run grammar tests, `npm run typecheck`, and `npm run build`.
- [x] Manually regression-test existing Speak conversations, Vocabulary, Flashcard,
  Quiz, authentication, and Progress Dashboard.
