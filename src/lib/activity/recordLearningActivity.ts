import type {
  LearningActivityEvent,
  LearningActivityInput,
} from "./activityTypes"
import {
  getGuestInstallationId,
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
    ...input,
    id: eventId,
    occurredAt: now.toISOString(),
    localDate: toLocalDateKey(now),
    timezoneOffsetMinutes: now.getTimezoneOffset(),
  }
}

export function getLatestTimestamp(
  current: string | null | undefined,
  next: string,
): string {
  if (!current || !Number.isFinite(Date.parse(current))) return next
  return Date.parse(current) >= Date.parse(next) ? current : next
}

export function upsertLocalEvent(
  events: LearningActivityEvent[],
  event: LearningActivityEvent,
): LearningActivityEvent[] {
  const existingIndex = events.findIndex(
    (existing) => existing.id === event.id,
  )
  if (existingIndex === -1) return [...events, event]

  const existing = events[existingIndex]
  if (Date.parse(existing.occurredAt) > Date.parse(event.occurredAt)) {
    return events
  }

  const nextEvents = [...events]
  nextEvents[existingIndex] = event
  return nextEvents
}

export function getActivityIdentityScope(
  userId?: string | null,
): string {
  const scopedUserId =
    userId === undefined ? getActiveActivityUserId() : userId
  return scopedUserId
    ? `user:${scopedUserId}`
    : `guest:${getGuestInstallationId()}`
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
  const events = upsertLocalEvent(currentLedger.events, event)

  saveLocalActivityLedger(userId, {
    version: 1,
    events,
    updatedAt: getLatestTimestamp(
      currentLedger.updatedAt,
      event.occurredAt,
    ),
  })

  if (userId) scheduleActivitySync(userId)
  return event
}
