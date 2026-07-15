export type LearningActivityKind =
  | "vocabulary_answer"
  | "grammar_answer"
  | "conversation_completed"
  | "practice_time"

export type LearningActivityMode = "flashcard" | "quiz" | "grammar" | "speak"

export type LearningActivityMetadata = {
  correct?: boolean
  wasDue?: boolean
  sessionId?: string
  durationSeconds?: number
}

export type LearningActivityEvent = {
  id: string
  kind: LearningActivityKind
  mode: LearningActivityMode
  entityId: string
  occurredAt: string
  localDate: string
  timezoneOffsetMinutes: number
  metadata?: LearningActivityMetadata
}

export type LearningActivityLedger = {
  version: 1
  events: LearningActivityEvent[]
  updatedAt: string | null
}

export type LearningActivityInput = Omit<
  LearningActivityEvent,
  "id" | "occurredAt" | "localDate" | "timezoneOffsetMinutes"
>
