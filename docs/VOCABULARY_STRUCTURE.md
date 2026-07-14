# Vocabulary Database Structure

## Overview
This document describes the structure and usage of the 2,000-word vocabulary database. 
The database is specifically designed for Thai learners starting to learn English, categorized by CEFR levels and common topics.

## CEFR Distribution (Total: 2,000 words)
- **A1**: 600 words (Beginner)
- **A2**: 700 words (Elementary)
- **B1**: 500 words (Intermediate)
- **B2**: 200 words (Upper Intermediate)

## JSON Schema
Each vocabulary word in the JSON files follows this strict structure:

```typescript
type VocabularyEntry = {
  id: string; // e.g. "word_a1_001"
  word: string; // The English word
  phonetic: string; // IPA phonetic transcription (e.g. "/wɜːrd/")
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb" | "phrase" | "other";
  cefr: "A1" | "A2" | "B1" | "B2";
  category: string; // From the approved category list
  thaiMeaning: string; // Accurate Thai translation
  simpleDefinition: string; // Simple English explanation
  exampleSentence: string; // Simple context sentence
  exampleThai: string; // Thai translation of the sentence
  iconName: string; // Lucide/Heroicon name (e.g. "Sun"). Use "Sparkles" as fallback.
  iconSource: "lucide" | "heroicons" | "sparkles";
  imagePrompt: string; // A prompt for AI to generate a relevant image
  tags: string[]; // 2-3 relevant tags
}
```

## Categories
1. Daily Life
2. Home
3. Bedroom
4. Kitchen
5. Bathroom
6. Food & Drink
7. Body & Health
8. Clothes
9. Family
10. School
11. Work
12. Travel
13. Shopping
14. Technology
15. Emotion
16. Time
17. Weather
18. Nature
19. City & Places
20. Money
21. Business
22. Communication
23. Other

## Data Files
The final processed data is split into multiple files for optimized loading in React/Next.js:
- `vocabulary-2000.json` (The complete master file)
- `vocabulary-a1.json` (600 A1 words)
- `vocabulary-a2.json` (700 A2 words)
- `vocabulary-b1.json` (500 B1 words)
- `vocabulary-b2.json` (200 B2 words)

## Usage in React / Next.js
You can import the JSON files directly into your components or load them via `fetch` if placed in the `public` directory.

```javascript
import vocabA1 from '../data/vocabulary-a1.json';

// Find a word by ID
const word = vocabA1.find(w => w.id === 'word_a1_001');

// Filter by category
const foodWords = vocabA1.filter(w => w.category === 'Food & Drink');
```
