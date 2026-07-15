import type { LearningActivityLedger } from "./activityTypes"
import { normalizeActivityLedger } from "./activityNormalizer"

export const DAILY_ACTIVITY_GOAL = 15
export const FLASHCARD_MISSION_TARGET = 10
export const SPEAK_MISSION_TARGET = 5
export const MAX_REVIEW_MISSION_TARGET = 5

export type ActivityProgress = {
  completed: number
  target: number
  percentage: number
  isComplete: boolean
}

export type LearningActivitySummary = {
  streakDays: number
  dailyGoal: ActivityProgress
  missions: {
    review: ActivityProgress & { visible: boolean }
    flashcards: ActivityProgress
    speak: ActivityProgress
  }
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0")
}

export function toLocalDateKey(date: Date): string {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-")
}

export function addLocalCalendarDays(localDate: string, amount: number): string {
  const [year, month, day] = localDate.split("-").map(Number)
  const date = new Date(year, month - 1, day, 12)
  date.setDate(date.getDate() + amount)
  return toLocalDateKey(date)
}

function toProgress(completed: number, target: number): ActivityProgress {
  const safeTarget = Math.max(0, Math.floor(target))
  const safeCompleted = Math.min(
    safeTarget,
    Math.max(0, Math.floor(completed)),
  )
  const percentage =
    safeTarget > 0 ? Math.round((safeCompleted / safeTarget) * 100) : 0

  return {
    completed: safeCompleted,
    target: safeTarget,
    percentage: Math.min(100, Math.max(0, percentage)),
    isComplete: safeTarget > 0 && safeCompleted >= safeTarget,
  }
}

function calculateStreak(activeDates: Set<string>, today: string): number {
  const yesterday = addLocalCalendarDays(today, -1)
  let cursor = activeDates.has(today)
    ? today
    : activeDates.has(yesterday)
      ? yesterday
      : null
  let streak = 0

  while (cursor && activeDates.has(cursor)) {
    streak += 1
    cursor = addLocalCalendarDays(cursor, -1)
  }

  return streak
}

export function summarizeLearningActivity(
  ledger: LearningActivityLedger,
  options: { now: Date; dueReviewWordsNow: number },
): LearningActivitySummary {
  const normalized = normalizeActivityLedger(ledger)
  const today = toLocalDateKey(options.now)
  const activeDates = new Set(normalized.events.map((event) => event.localDate))
  const todayEvents = normalized.events.filter(
    (event) => event.localDate === today,
  )

  const dueWordIds = new Set(
    todayEvents
      .filter(
        (event) =>
          event.kind === "vocabulary_answer" &&
          event.mode === "flashcard" &&
          event.metadata?.wasDue === true,
      )
      .map((event) => event.entityId),
  )
  const dueReviewWordsNow = Math.max(
    0,
    Math.floor(Number.isFinite(options.dueReviewWordsNow) ? options.dueReviewWordsNow : 0),
  )
  const reviewTarget = Math.min(
    MAX_REVIEW_MISSION_TARGET,
    dueReviewWordsNow + dueWordIds.size,
  )
  const review = toProgress(dueWordIds.size, reviewTarget)

  const flashcardCount = todayEvents.filter(
    (event) =>
      event.kind === "vocabulary_answer" && event.mode === "flashcard",
  ).length
  const speakCompletionCount = todayEvents.filter(
    (event) =>
      event.kind === "conversation_completed" && event.mode === "speak",
  ).length

  return {
    streakDays: calculateStreak(activeDates, today),
    dailyGoal: toProgress(todayEvents.length, DAILY_ACTIVITY_GOAL),
    missions: {
      review: { ...review, visible: reviewTarget > 0 },
      flashcards: toProgress(flashcardCount, FLASHCARD_MISSION_TARGET),
      speak: toProgress(speakCompletionCount, SPEAK_MISSION_TARGET),
    },
  }
}
