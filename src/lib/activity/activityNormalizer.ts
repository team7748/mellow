import type {
  LearningActivityEvent,
  LearningActivityKind,
  LearningActivityLedger,
  LearningActivityMetadata,
  LearningActivityMode,
} from "./activityTypes"

const activityKinds = new Set<LearningActivityKind>([
  "vocabulary_answer",
  "grammar_answer",
  "conversation_completed",
])

const activityModes = new Set<LearningActivityMode>([
  "flashcard",
  "quiz",
  "grammar",
  "speak",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.includes("T") &&
    Number.isFinite(Date.parse(value))
  )
}

function isLocalDate(value: unknown): value is string {
  if (typeof value !== "string") return false

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function normalizeMetadata(value: unknown): LearningActivityMetadata | undefined {
  if (!isRecord(value)) return undefined

  const metadata: LearningActivityMetadata = {}
  if (typeof value.correct === "boolean") metadata.correct = value.correct
  if (typeof value.wasDue === "boolean") metadata.wasDue = value.wasDue
  if (isNonEmptyString(value.sessionId)) metadata.sessionId = value.sessionId

  return Object.keys(metadata).length > 0 ? metadata : undefined
}

function latestTimestamp(values: Array<string | null | undefined>): string | null {
  let latest: string | null = null

  for (const value of values) {
    if (!isIsoTimestamp(value)) continue
    if (latest === null || Date.parse(value) > Date.parse(latest)) latest = value
  }

  return latest
}

export function createEmptyActivityLedger(): LearningActivityLedger {
  return { version: 1, events: [], updatedAt: null }
}

export function normalizeActivityEvent(value: unknown): LearningActivityEvent | null {
  if (!isRecord(value)) return null
  if (!isNonEmptyString(value.id)) return null
  if (!activityKinds.has(value.kind as LearningActivityKind)) return null
  if (!activityModes.has(value.mode as LearningActivityMode)) return null
  if (!isNonEmptyString(value.entityId)) return null
  if (!isIsoTimestamp(value.occurredAt)) return null
  if (!isLocalDate(value.localDate)) return null
  if (
    !Number.isInteger(value.timezoneOffsetMinutes) ||
    (value.timezoneOffsetMinutes as number) < -840 ||
    (value.timezoneOffsetMinutes as number) > 840
  ) {
    return null
  }

  const metadata = normalizeMetadata(value.metadata)

  return {
    id: value.id,
    kind: value.kind as LearningActivityKind,
    mode: value.mode as LearningActivityMode,
    entityId: value.entityId,
    occurredAt: value.occurredAt,
    localDate: value.localDate,
    timezoneOffsetMinutes: value.timezoneOffsetMinutes as number,
    ...(metadata ? { metadata } : {}),
  }
}

export function normalizeActivityLedger(value: unknown): LearningActivityLedger {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.events)) {
    return createEmptyActivityLedger()
  }

  const eventsById = new Map<string, LearningActivityEvent>()

  for (const candidate of value.events) {
    const event = normalizeActivityEvent(candidate)
    if (!event) continue

    const existing = eventsById.get(event.id)
    if (!existing || Date.parse(event.occurredAt) > Date.parse(existing.occurredAt)) {
      eventsById.set(event.id, event)
    }
  }

  const events = [...eventsById.values()].sort((left, right) => {
    const timestampDifference =
      Date.parse(left.occurredAt) - Date.parse(right.occurredAt)
    return timestampDifference || left.id.localeCompare(right.id)
  })

  return {
    version: 1,
    events,
    updatedAt: latestTimestamp([
      isIsoTimestamp(value.updatedAt) ? value.updatedAt : null,
      ...events.map((event) => event.occurredAt),
    ]),
  }
}
