export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"

export type MemoryStatus = "New" | "Learning" | "Review" | "Mastered"

export type WordStatus = "new" | "learning" | "review" | "mastered"

export type UsageNotes = {
  howToUse?: string
  commonSituation?: string
  formality?: string
  warning?: string
  thaiLearnerTip?: string
}

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "pronoun"
  | "conjunction"
  | "phrase"

export type VocabCategory =
  | "Daily Life"
  | "Bedroom"
  | "Bathroom"
  | "Kitchen"
  | "Food & Drinks"
  | "Body & Health"
  | "Clothes"
  | "People & Family"
  | "School & Work"
  | "Places"
  | "Travel"
  | "Shopping & Money"
  | "Feelings"
  | "Objects"
  | "Basic Actions"
  | "Nature & Animals"
  | "Technology"

export type VocabLevel = 1 | 2 | 3

export type AssetType = "none" | "library-icon" | "custom-icon" | "image" | "scene"

export type AssetSource = "none" | "library" | "custom" | "ai" | "placeholder"

export type VocabularyContext = {
  meaning: string
  example: string
  thaiExample: string
}

export type VocabularyItem = {
  id: string
  sourceId: string
  sourceScenario: string
  scenario: "jobInterview" | "customerService" | "onlineSelling" | string
  scenarioThai: string
  word: string
  cefr: CefrLevel
  partOfSpeech: string
  ipa: string
  thaiReading: string
  thaiPronunciation: string
  thaiMeaning: string
  simpleMeaning: string
  example: string
  exampleThai: string
  contexts: {
    daily: VocabularyContext
    work: VocabularyContext
    study: VocabularyContext
    [scenario: string]: VocabularyContext | undefined
  }
  synonyms: string[]
  commonMistake: string
  memoryTip: string
  allocationStatus: "Core MVP" | "Stretch useful" | string
  memoryStatus: MemoryStatus
  nextReviewDate: string
  reviewCount: number
  correctCount: number
  wrongCount: number
  // --- New category & icon fields (optional for backward compatibility) ---
  category?: VocabCategory[]
  subcategory?: string
  level?: VocabLevel
  partOfSpeechStandard?: PartOfSpeech
  assetType?: AssetType
  assetSource?: AssetSource
  icon?: string
  image?: string
  fallbackIcon?: string
  
  // --- Custom fields for C1/C2 ---
  tags?: string[]
  usageContextTH?: string
  flashcard?: {
    front: string
    back: string
  }
  quiz?: {
    questionTH: string
    answerTH: string
    hintTH: string
  }
  
  // --- Deep Context & Extended Fields ---
  frequency?: string
  contextExamples?: Array<{
    situation: string
    explanationThai: string
    exampleEn: string
    exampleThai: string
  }>
  additionalExamples?: Array<{
    sentenceEn: string
    sentenceThai: string
  }>
  qaExamples?: Array<{
    questionEn: string
    questionThai: string
    answerEn: string
    answerThai: string
  }>
  collocations?: Array<{
    text: string
    meaningThai?: string
  }>
  confusingWords?: Array<{
    word: string
    meaningThai: string
    differenceThai: string
  }>
  thaiUsageTip?: string
  usageNotes?: UsageNotes
}

export type WordProgress = {
  wordId: string
  status: WordStatus
  difficulty?: "forgot" | "medium" | "known"
  correctCount: number
  wrongCount: number
  lastStudiedAt: string | null
  nextReviewAt: string | null
  updatedAt: string
}

export type UserProgress = {
  learnedWordIds: string[]
  words: Record<string, WordProgress>
  updatedAt: string | null
}

export type QuizResult = {
  wordId: string
  isCorrect: boolean
  selectedAnswer: string
  correctAnswer: string
  answeredAt: string
}

export type ProgressStats = {
  totalWords: number
  learnedWords: number
  newWords: number
  learningWords: number
  reviewWords: number
  masteredWords: number
  dueReviewWords: number
  correctAnswers: number
  wrongAnswers: number
}
