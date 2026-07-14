# Grammar Mode Specification (Implemented)

## Overview

Grammar Mode is an integrated learning area within the application. It exposes twelve supplied tense topics (Present Simple through Future Perfect Continuous) based on a structured JSON format. 

## Current System Integration

- **Routes**:
  - `/#speak?view=grammar` is used to list Grammar Topics inside Speak Mode.
  - `/#grammar/:topicId` points to the `GrammarLessonPage` for specific topic learning.
  - `/#flashcard` handles Unified Flashcard Practice (Vocab + Grammar).
- **Storage & Progress**:
  - `grammar-progress-store` in LocalStorage is managed by `src/hooks/useGrammarProgress.ts` to track attempts, completion, mistakes, and spaced-repetition (SRS).
  - Vocabulary progress (`thai-english-vocab-progress`) remains separate, but the unified `srsService` handles both entity types using string IDs.
- **Answer Checking & Speak Mode Integration**:
  - `InteractivePracticePlayer.tsx` sends answers to `api/lib/speakAnswerEvaluator.ts` (powered by Gemini AI) to detect `grammar_error`.
  - When a grammar error is detected in Speak Mode, it maps the Speak Category (via `src/data/speak/grammarMapping.ts`) to a specific Grammar Topic.
  - Users are offered a "Practice Grammar" button, which opens `GrammarMiniPractice.tsx` (a 3-question targeted flashcard session) without losing conversation context.
- **Audio**:
  - Web Speech API is used. Grammar Flashcards do **not** autoplay audio per specifications.

## Architecture

```text
App Routes
├─ /#speak (Speak Mode)
│  ├─ Conversation Practice
│  └─ Grammar Mini Practice (Interrupt when grammar mistakes occur)
├─ /#speak?view=grammar (Topic List)
├─ /#grammar/:topicId (Grammar Lesson)
│  ├─ Rule Explanations
│  ├─ Interactive Examples
│  └─ End-of-Lesson Flashcard Practice
└─ /#flashcard (Flashcard & SRS)
   └─ Unified Flashcards (Mixed Vocab + Grammar)
```

## Page Structure and Component Architecture (Realized)

- `GrammarLessonPage.tsx`: Renders the topic lesson, rules, structures, and common mistakes.
- `FlashcardPractice.tsx` & `SwipeableCard.tsx`: Upgraded to handle `UnifiedFlashcard` (both Vocab and Grammar types natively).
- `GrammarMiniPractice.tsx`: Dynamically generates and selects 3 flashcards for quick practice inside Speak Mode.
- `useUnifiedFlashcardSetup.ts`: Engine for loading, parsing, and merging Vocabulary and Grammar cards dynamically without duplicating datasets.
- `grammarTopicRegistry`: Isolates source lookup and lazy-loads JSON chunks via dynamic imports.

## Data and Answer-Checking Flow

The application parses root JSON files via `grammarTopicRegistry`.
During Speak Mode practice, answers are validated via the backend API `/api/speak-answer-check`.
The evaluator distinguishes between meaning errors, unnatural phrasing, real grammatical errors, and minor spelling typos (typos do not force grammar practice).

## Progress, Flashcard, and SRS Flow

Grammar flashcards are dynamically generated on-the-fly (`generateGrammarFlashcards.ts`) from the base JSON rules and sentences, mapping directly into standard card shapes (`rule`, `fill_blank`, `correct_or_incorrect`, etc.).
When users complete a grammar flashcard, `useGrammarProgress` handles updating pattern mastery, while `srsService` calculates intervals (Again/Hard/Good/Easy).

## Known Limitations

- **Guest Only Validation**: Backend persistence (Supabase) for Grammar Progress is not yet linked. Progress relies strictly on LocalStorage.
- **Grammar Generation Variance**: Flashcards are generated dynamically from arrays. If JSON arrays are small, some card variations might feel repetitive.

## Acceptance Status

- [x] Grammar is integrated natively.
- [x] Content is loaded from JSON registry.
- [x] Flashcards and SRS track grammar independently.
- [x] Speak Mode recommends grammar on mistakes without disrupting the conversational flow.
