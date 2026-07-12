# Grammar test checklist

## Data and loading

- [ ] All twelve JSON files parse as UTF-8 JSON; no duplicate IDs/slugs/orders.
- [ ] Registry contains exactly the valid files and detects broken prerequisites.
- [ ] Missing schema/content/status fields follow the approved legacy/migration rule.
- [ ] Topic list lazy-loads summaries/content as designed and recovers from failure.

## Navigation and lessons

- [ ] Grammar is first in Speak Mode; existing scenario cards still work.
- [ ] Grammar is not a bottom-navigation item.
- [ ] Direct URL, refresh, back, and forward behave correctly for proposed subviews.
- [ ] All 12 topics group and order correctly; lesson sections render source content.
- [ ] Loading, empty, and error states retain a usable return/retry route.

## Audio, practice, and answer checking

- [ ] On-demand audio uses supported browser speech and never autoplays.
- [ ] Each source question type gets the appropriate control and keyboard behavior.
- [ ] Correct, incorrect, contraction, capitalization, punctuation, and equivalent
  answers are evaluated according to the declared question type.
- [ ] Open answers are not judged by exact string alone.
- [ ] Feedback includes only real evaluated data; no fabricated AI feedback.

## Progress, flashcards, and SRS

- [ ] Progress saves before navigation and survives refresh.
- [ ] Topic completion, accuracy, practice count, cards reviewed, and due reviews
  derive from actual grammar records.
- [ ] Mistakes deduplicate a single response and reference a stable topic.
- [ ] Grammar cards support Again/Hard/Good/Easy without vocabulary collisions.
- [ ] Guest data uses a dedicated key; authenticated data is user-scoped and RLS
  prevents cross-user reads/writes.
- [ ] Existing LocalStorage, Speak, vocabulary, and flashcard state is unchanged.

## Responsive, accessibility, theme, and regression

- [ ] Test small iPhone/Android widths, tablet portrait/landscape, and desktop.
- [ ] Test touch-only and keyboard-only flows; focus is visible and ordered.
- [ ] Confirm semantic heading order, labels, screen-reader status, contrast, and
  non-color-only feedback.
- [ ] Verify dark mode and reduced motion.
- [ ] Run grammar tests, `npm test`, and `npm run build`.
- [ ] Manually regression-test existing Speak conversations, Vocabulary, Flashcard,
  Quiz, authentication, and Progress Dashboard.
