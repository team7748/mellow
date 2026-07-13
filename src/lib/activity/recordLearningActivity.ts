import type {
  LearningActivityEvent,
  LearningActivityInput,
} from "./activityTypes"
import {
  loadLocalActivityLedger,
  saveLocalActivityLedger,
} from "./activityLocalStorage"
import {
  getActiveActivityUserId,
  scheduleActivitySync,
} from "./activitySyncManager"
import { toLocalDateKey } from "./activitySummary"

export type RecordLearningActivityOptions = {
  userId?: string | null
  eventId?: string
  now?: Date
}

export function createLearningActivityEvent(
  input: LearningActivityInput,
  options: Pick<RecordLearningActivityOptions, "eventId" | "now"> = {},
): LearningActivityEvent {
  const now = options.now ?? new Date()
  const eventId =
    options.eventId ??
    globalThis.crypto?.randomUUID?.() ??
    `activity-${now.getTime()}-${Math.random().toString(36).slice(2)}`

  return {
    id: eventId,
    ...input,
    occurredAt: now.toISOString(),
    localDate: toLocalDateKey(now),
    timezoneOffsetMinutes: now.getTimezoneOffset(),
  }
}

export function getConversationCompletionEventId(
  scope: string,
  conversationId: string,
  localDate: string,
): string {
  return `speak:${encodeURIComponent(scope)}:${encodeURIComponent(conversationId)}:${localDate}`
}

export function recordLearningActivity(
  input: LearningActivityInput,
  options: RecordLearningActivityOptions = {},
): LearningActivityEvent {
  const userId =
    options.userId === undefined
      ? getActiveActivityUserId()
      : options.userId
  const event = createLearningActivityEvent(input, options)
  const currentLedger = loadLocalActivityLedger(userId)

  saveLocalActivityLedger(userId, {
    version: 1,
    events: [...currentLedger.events, event],
    updatedAt: event.occurredAt,
  })

  if (userId) scheduleActivitySync()
  return event
}
