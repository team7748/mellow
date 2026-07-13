export type ConversationCategory = {
  id: string
  title: string
  thaiTitle: string
  conversationCount: number
  lineCount: number
  vocabCount: number
  practiceCount: number
}

export type ConversationLine = {
  categoryId: string
  categoryTitle: string
  categoryThai: string
  conversationId: string
  conversationNo: number
  conversationTitle: string
  lineNo: number
  speaker: string
  english: string
  thai: string
}

export type ConversationVocab = {
  categoryId: string
  categoryTitle: string
  categoryThai: string
  vocabNo: number
  word: string
  thaiMeaning: string
}

export type ConversationPractice = {
  categoryId: string
  categoryTitle: string
  categoryThai: string
  questionNo: number
  questionEnglish: string
  questionThai: string
  answerExample?: string
  usefulPhrases?: string
}

export type SpeakModeProgress = {
  lastCategoryId: string | null
  lastConversationId: string | null
  lastLineNo: number | null
  completedConversations: string[] // array of conversationIds
  lastPracticedDate: string | null // ISO date string
  practiceScores?: Record<string, { correctCount: number; errorCount: number; grammarErrorCount: number }> // Keyed by categoryId
}
