export type GrammarTopicProgress = {
  topicId: string
  status: "new" | "learning" | "mastered"
  lessonViewed: boolean
  lessonCompleted: boolean
  practiceAttempts: number
  questionsAnswered: number
  correctAnswers: number
  accuracy: number
  masteryScore: number
  needsReview: boolean
  lastPracticedAt: string | null
}

export type GrammarQuestionProgress = {
  questionId: string
  attempts: number
  correct: number
  mistakes: number
  lastAnsweredAt: string
}

export type GrammarPatternProgress = {
  patternId: string
  correctCount: number
  wrongCount: number
}

export type GrammarMistakeRecord = {
  id: string
  topicId: string
  questionId: string
  patternId: string | null
  userAnswer: string
  correctAnswer: string
  errorTypes: string[]
  timestamp: string
  resolved: boolean
  reviewCount: number
}

export type GrammarProgressV2 = {
  version: 2
  topics: Record<string, GrammarTopicProgress>
  questions: Record<string, GrammarQuestionProgress>
  patterns: Record<string, GrammarPatternProgress>
  mistakes: GrammarMistakeRecord[]
  updatedAt: string | null
}
