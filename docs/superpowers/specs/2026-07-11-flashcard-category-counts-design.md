# Flashcard category vocabulary counts

## Goal

Show the total vocabulary count for every category in the Flashcard category selector. The count represents every vocabulary item assigned to that category, regardless of the currently selected CEFR level, status, search text, or training mode.

## Scope

- Update only the native category `<select>` in `FlashcardSetup`.
- Keep the existing Thai and English category labels.
- Append a localized count, for example `ชีวิตประจำวัน (Daily Life) — 187 คำ`.
- Leave filtering, session construction, manual-selection limits, and Random 20 unchanged.

## Data flow

`FlashcardSetup` already gets the complete category list from `getAllCategories()`. It will also derive a memoized lookup from `getAllVocabulary()` by counting every occurrence of each category in each word's `category` array. The option renderer will read the lookup using the category value as its key and render `0` only if a category has no matching vocabulary.

## Accessibility and interaction

The control remains a native `<select>` with the same id, label, value, change handler, keyboard behavior, and accessible name. The appended count is part of the option's text, so screen readers announce the category and its total together. No motion or visual redesign is required.

## Validation

- Add a component test with vocabulary in multiple categories and one word assigned to more than one category.
- Verify each option has the expected all-vocabulary total.
- Verify changing another filter does not alter the option labels.
- Run Flashcard tests and a production build.
