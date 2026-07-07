# Progress Dashboard Design

## Goal

Build the existing Home page / "สรุปผล" navigation item into a real learner progress dashboard. The dashboard must use the actual vocabulary dataset and saved LocalStorage progress instead of hard-coded counts.

## User-Facing Requirements

- Show total vocabulary count from `src/data/vocabulary.json`.
- Show words that are not learned yet.
- Show words currently learning.
- Show words that need review.
- Show mastered words.
- Show progress percentage.
- Provide a reset progress button.
- Provide export progress and import progress buttons.

## Recommended Placement

Use the current Home page as the dashboard. This keeps the app simple for the MVP and matches the existing "สรุปผล" navigation item, which already behaves like the summary entry point.

The page should still include primary learning actions so users can continue learning quickly:

- Start learning / practice action.
- Open vocabulary list action.

## Dashboard Metrics

The dashboard reads metrics from `calculateProgressStats()` in `src/utils/vocabulary.ts`.

Metric mapping:

- Total words: `totalWords`
- Not learned yet: `newWords`
- Learning: `learningWords`
- Need review: `dueReviewWords`
- Mastered: `masteredWords`
- Progress percentage: `masteredWords / totalWords * 100`, rounded to a whole number

If `totalWords` is `0`, progress percentage should be `0%`.

## UI Design

The page should be mobile-first and consistent with the existing app:

- A compact intro section with Thai-first copy.
- A progress summary band showing percentage and a horizontal progress bar.
- Six stat cards for the requested metrics.
- A small action area for reset/export/import.
- Clear status or error text after import/reset/export actions when useful.

Buttons should use existing button styling and lucide icons where appropriate:

- Reset: `RotateCcw`
- Export: `Download`
- Import: `Upload`

The reset action should be visibly secondary or caution-styled so it does not compete with the main learning actions.

## Progress Actions

### Reset

Reset removes saved progress from LocalStorage through the existing storage layer, then refreshes the dashboard numbers. The UI should show a short confirmation message after reset.

### Export

Export downloads a JSON file containing the current progress object. The exported file should include the existing `UserProgress` shape:

```ts
type UserProgress = {
  learnedWordIds: string[]
  words: Record<string, WordProgress>
  updatedAt: string | null
}
```

The filename can be `vocabulary-progress.json`.

### Import

Import lets the user choose a JSON file. The app should parse and validate that it looks like a `UserProgress` object before saving:

- `learnedWordIds` must be an array.
- `words` must be an object.
- `updatedAt` may be `string` or `null`.

If the file is invalid or cannot be parsed, the app must not overwrite current progress and should show a short error message.

## Code Structure

Add small, testable helpers to the existing storage/progress boundary:

- `loadProgress()` remains the canonical reader.
- `saveProgress()` remains the canonical writer.
- Add validation/import helper if needed to avoid putting JSON shape checks directly inside the component.

Add a dashboard component:

- `src/components/progress/ProgressDashboard.tsx`

Update:

- `src/pages/HomePage.tsx` to render the dashboard and remove hard-coded vocabulary stats.

No new route is required.

## Error Handling

- Broken or invalid existing LocalStorage data should keep falling back to empty progress through `loadProgress()`.
- Invalid import files should not change LocalStorage.
- Import file read failures should show an error message.
- Export should handle an empty progress state by exporting the empty progress object.

## Testing

Use TDD for implementation.

Recommended tests:

- Storage/import validation accepts a valid progress object.
- Storage/import validation rejects malformed progress without saving.
- Dashboard renders counts from real vocabulary stats.
- Dashboard shows `0%` when there is no mastered progress.
- Reset clears progress and refreshes counts.
- Import valid progress refreshes dashboard counts.
- Import invalid JSON shows an error and keeps existing progress.

Existing tests that assert hard-coded Home page stats should be updated to the new dashboard behavior.

## Out of Scope

- New analytics charts.
- Backend sync.
- User accounts.
- Detailed learning history by date.
- New navigation route.
