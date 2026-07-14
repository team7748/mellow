export type FlashcardType = "vocabulary" | "rule" | "correct_or_incorrect" | "fill_blank" | "compare" | "common_mistake";

export type UnifiedFlashcard = {
  id: string; // Unified unique ID representing this specific card session (e.g. patternId_variationId)
  type: FlashcardType;
  front: string;
  back: string;
  note?: string; // Additional context or hint
  example?: string; // Example sentence or usage
  ipa?: string; // Pronunciation for vocabulary cards

  // For Vocabulary
  wordId?: string;
  cefr?: string;
  partOfSpeech?: string;
  category?: string[];

  // For Grammar
  topicId?: string;
  patternId?: string;
  variationGroupId?: string;
  
  // Extra fields for rendering specialized cards
  options?: string[]; // For multiple choice / correct_or_incorrect
}
