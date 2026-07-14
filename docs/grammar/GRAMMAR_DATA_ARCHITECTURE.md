# Grammar Data Architecture (Implemented)

## JSON Source of Truth

The twelve existing tense JSON files are the sole source for grammar teaching content. Components do not duplicate grammar prose, examples, rules, questions, or flashcards. 

## Topic Registry and Stable IDs

The registry is implemented in `src/data/grammar/registry.ts`.
- Exposes `grammarTopicRegistry`, a typed registry with records for each topic containing metadata (`categoryId`, `name`, `nameThai`, `stage`, `difficulty`, `displayOrder`, `estimatedMinutes`).
- Topics are dynamically loaded via a `loader: () => Promise<{ default: GrammarTopic }>` function (e.g. `() => import('./topics/topic-present-simple.json')`).
- IDs act as stable references for routing (`/#grammar/topic-present-simple`), progress (`grammarProgressStore`), and Flashcards.

## TypeScript Types

Types are strictly defined in `src/types/grammar.ts` and `src/types/flashcardItem.ts`.
- `GrammarTopic` maps to the JSON file schemas.
- `UnifiedFlashcard` is a polymorphic interface accommodating both Vocab and Grammar flashcards for the unified practice engine.

## Validation and Data Loader

- `grammarTopicRegistry` acts as the data loader, surfacing metadata without fetching the entire JSON file.
- The full lesson body is lazy-loaded by `GrammarLessonPage` and `useUnifiedFlashcardSetup`.
- Any missing or invalid data results in safe UI error boundaries (e.g. "ไม่สามารถโหลดเนื้อหาไวยากรณ์ได้") without crashing the application.

## Progress and SRS References

- **Storage**: `localStorage.getItem('grammar-progress-store')` isolated via `useGrammarProgress.ts`.
- **Schema**: Tracks progress by `topicId` and specific `patternId`s.
- **SRS Storage**: `localStorage.getItem('srsProgress')` is unified and utilizes the `cardId` (which maps back to pattern IDs and variations) to decouple spaced-repetition timing from the content state.
- **Deduping Mistakes**: The progress model deduplicates mistakes within a single session, preventing double penalties for identical errors in the same attempt.
