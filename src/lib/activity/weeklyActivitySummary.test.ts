import { describe, expect, it } from "vitest"
import type { LearningActivityEvent } from "./activityTypes"
import { summarizeWeeklyActivity } from "./weeklyActivitySummary"

function event(
  id: string,
  localDate: string,
  overrides: Partial<LearningActivityEvent> = {},
): LearningActivityEvent {
  return {
    id,
    kind: "vocabulary_answer",
    mode: "flashcard",
    entityId: id,
    occurredAt: `${localDate}T05:00:00.000Z`,
    localDate,
    timezoneOffsetMinutes: -420,
    ...overrides,
  }
}

describe("summarizeWeeklyActivity", () => {
  it("returns exactly seven local days across month and year boundaries", () => {
    const days = summarizeWeeklyActivity([], new Date(2026, 0, 2, 12))
    expect(days.map((day) => day.localDate)).toEqual([
      "2025-12-27", "2025-12-28", "2025-12-29", "2025-12-30",
      "2025-12-31", "2026-01-01", "2026-01-02",
    ])
  })

  it("summarizes real action counts and practice seconds by mode", () => {
    const days = summarizeWeeklyActivity([
      event("flash", "2026-07-13"),
      event("quiz", "2026-07-13", { mode: "quiz" }),
      event("grammar", "2026-07-13", { kind: "grammar_answer", mode: "grammar" }),
      event("speak", "2026-07-13", { kind: "conversation_completed", mode: "speak" }),
      event("time", "2026-07-13", {
        kind: "practice_time",
        mode: "speak",
        metadata: { sessionId: "session-1", durationSeconds: 90 },
      }),
      event("future", "2026-07-14"),
    ], new Date(2026, 6, 13, 12))

    expect(days[6]).toMatchObject({
      totalActions: 4,
      totalPracticeSeconds: 90,
      actionCounts: { flashcard: 1, quiz: 1, grammar: 1, speak: 1 },
      practiceSeconds: { flashcard: 0, quiz: 0, grammar: 0, speak: 90 },
    })
  })
})
