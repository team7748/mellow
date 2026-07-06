# Quiz Mode Design

## Context

The app is a Vite React TypeScript vocabulary trainer. It already has a
Flashcard mode, vocabulary utilities, LocalStorage-backed word progress, and a
`QuizResult` type. Quiz Mode should use the real vocabulary dataset from
`src/data/vocabulary.json`, but it should not be limited to due review words.

## Goals

- Add a dedicated `QuizPage`.
- Add a new quiz helper module for question generation and result persistence.
- Generate quiz questions from all vocabulary words.
- Support four unique answer options per question.
- Show an immediate answer result after the user selects an option.
- Save every answered quiz result to LocalStorage.
- Show a clear not-ready state when fewer than four vocabulary words are
  available.

## Non-Goals

- Do not change the Flashcard spaced-repetition rules.
- Do not require backend storage.
- Do not add scoring dashboards or history views in this feature.
- Do not filter quiz questions by status, scenario, or CEFR level yet.

## Question Types

The quiz helper will support these question types:

1. `english-to-thai`: prompt with `VocabularyItem.word`; correct answer is
   `VocabularyItem.thaiMeaning`.
2. `thai-to-english`: prompt with `VocabularyItem.thaiMeaning`; correct answer
   is `VocabularyItem.word`.
3. `sentence-to-word`: prompt with `VocabularyItem.example`; correct answer is
   `VocabularyItem.word`. This type is only eligible when the selected word has
   a non-empty `example`.

The helper may choose among eligible types randomly. If the selected word has no
example sentence, it must only choose from the first two types.

## Quiz Helper

Create `src/utils/quiz.ts`.

Public API:

```ts
type QuizQuestionType =
  | "english-to-thai"
  | "thai-to-english"
  | "sentence-to-word"

type QuizQuestion = {
  id: string
  type: QuizQuestionType
  wordId: string
  prompt: string
  correctAnswer: string
  options: string[]
}

function canCreateQuiz(words: VocabularyItem[]): boolean
function createQuizQuestion(words: VocabularyItem[]): QuizQuestion | null
function saveQuizResult(result: QuizResult): void
function loadQuizResults(): QuizResult[]
function clearQuizResults(): void
```

Implementation rules:

- `canCreateQuiz` returns `true` only when there are at least four words.
- `createQuizQuestion` returns `null` when fewer than four words are available.
- `options` always contains exactly four strings.
- `options` always includes `correctAnswer`.
- `options` never contains duplicate strings.
- Distractors come from other vocabulary words and match the answer language for
  the chosen question type.
- If duplicate meanings or words in the dataset make four unique options
  impossible for a type, the helper should try another eligible type or return
  `null`.
- Randomization should be injectable or controllable in tests so tests can
  verify behavior deterministically.

## LocalStorage

Use this separate key from progress storage:

```ts
thai-english-vocab-quiz-results
```

Saved values are an array of `QuizResult`:

```ts
{
  wordId: string
  isCorrect: boolean
  selectedAnswer: string
  correctAnswer: string
  answeredAt: string
}
```

The loader should recover gracefully from missing or malformed data by returning
an empty array.

## QuizPage UI

Add `src/pages/QuizPage.tsx` and route it through `App.tsx`.

Main states:

- Not ready: show "Quiz ยังไม่พร้อม" when fewer than four words are available or
  no valid four-option question can be generated.
- Active question: show the question type label, prompt, and four option
  buttons.
- Answered: immediately show whether the selected answer is correct, display the
  correct answer, and offer a next-question button.

Navigation:

- Update the existing "ทดสอบ" navigation item so it opens `quiz` instead of
  returning to `home`.
- Add `quiz` to the `AppPage` union.

Interaction:

- Option buttons are disabled after an answer is selected.
- On selection, save a `QuizResult` immediately.
- The next-question button generates a fresh question from all vocabulary words.

## Testing

Follow TDD.

Unit tests for the helper:

- `canCreateQuiz` is false for fewer than four words.
- generated questions have four unique options.
- generated options include the correct answer.
- English-to-Thai questions use Thai meaning options.
- Thai-to-English questions use English word options.
- sentence questions are only generated for words with examples.
- quiz results are saved to and loaded from LocalStorage.
- malformed LocalStorage returns an empty result array.

Page tests:

- QuizPage shows the not-ready message when the helper cannot create a quiz.
- QuizPage renders a real prompt and four options.
- selecting an option shows immediate correct/incorrect feedback.
- selecting an option saves a result to LocalStorage.
- clicking next renders another active question.
- the app navigation opens Quiz Mode from the "ทดสอบ" item.

## Acceptance Criteria

- Quiz Mode uses all vocabulary words from the real dataset.
- Every quiz question has exactly four unique options.
- Quiz Mode refuses to start when fewer than four words are available.
- The user gets immediate answer feedback.
- Quiz results persist in LocalStorage.
- Existing Flashcard and vocabulary tests continue to pass.
