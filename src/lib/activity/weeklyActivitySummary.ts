import { addLocalCalendarDays, toLocalDateKey } from "./activitySummary"
import { normalizeActivityLedger } from "./activityNormalizer"
import type { LearningActivityEvent, LearningActivityMode } from "./activityTypes"

export type ActivityModeTotals = Record<LearningActivityMode, number>

export type DailyActivitySummary = {
  localDate: string
  actionCounts: ActivityModeTotals
  practiceSeconds: ActivityModeTotals
  totalActions: number
  totalPracticeSeconds: number
}

function emptyModeTotals(): ActivityModeTotals {
  return { flashcard: 0, quiz: 0, grammar: 0, speak: 0 }
}

export function summarizeWeeklyActivity(
  events: LearningActivityEvent[],
  now = new Date(),
): DailyActivitySummary[] {
  const today = toLocalDateKey(now)
  const days = Array.from({ length: 7 }, (_, index) => {
    const localDate = addLocalCalendarDays(today, index - 6)
    return {
      localDate,
      actionCounts: emptyModeTotals(),
      practiceSeconds: emptyModeTotals(),
      totalActions: 0,
      totalPracticeSeconds: 0,
    }
  })
  const byDate = new Map(days.map((day) => [day.localDate, day]))
  const normalized = normalizeActivityLedger({ version: 1, events, updatedAt: null })

  for (const event of normalized.events) {
    const day = byDate.get(event.localDate)
    if (!day) continue
    if (event.kind === "practice_time") {
      const seconds = event.metadata?.durationSeconds ?? 0
      day.practiceSeconds[event.mode] += seconds
      day.totalPracticeSeconds += seconds
    } else {
      day.actionCounts[event.mode] += 1
      day.totalActions += 1
    }
  }

  return days
}
