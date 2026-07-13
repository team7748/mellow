export type SrsStatus = "new" | "learning" | "review" | "mastered"
export type IntervalUnit = "minutes" | "hours" | "days"

export interface SrsRecord {
  wordId: string
  status: SrsStatus
  easeFactor: number
  interval: number
  intervalUnit: IntervalUnit
  repetition: number
  dueDate: string // ISO string
  lastReviewedAt: string // ISO string
  correctCount: number
  wrongCount: number
  totalReviews: number
}

// Session log structure
export interface SessionLog {
  sessionId: string
  mode: string
  date: string // ISO string
  totalWords: number
  rememberedCount?: number
  forgottenCount?: number
  againCount?: number
  hardCount?: number
  goodCount?: number
  easyCount?: number
  loopCount: number
  reviewedWordIds: string[]
  nextDueSoonCount?: number
  srsEnabled: boolean
}
