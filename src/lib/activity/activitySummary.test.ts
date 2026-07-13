import { describe, expect, it } from "vitest"
import type {
  LearningActivityEvent,
  LearningActivityLedger,
} from "./activityTypes"
import {
  addLocalCalendarDays,
  summarizeLearningActivity,
  toLocalDateKey,
} from "./activitySummary"

const now = new Date(2026, 6, 13, 12, 0, 0)

function event(
  id: string,
  localDate: string,
  overrides: Partial<LearningActivityEvent> = {},
): LearningActivityEvent {
  return {
    id,
    kind: "vocabulary_answer",
    mode: "quiz",
    entityId: `word-${id}`,
    occurredAt: `${localDate}T05:00:00.000Z`,
    localDate,
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    ...overrides,
  }
}

function ledger(events: LearningActivityEvent[]): LearningActivityLedger {
  return { version: 1, events, updatedAt: null }
}

describe("activity local calendar helpers", () => {
  it("formats and advances local calendar dates without UTC conversion", () => {
    expect(toLocalDateKey(new Date(2026, 6, 3, 23, 30))).toBe("2026-07-03")
    expect(addLocalCalendarDays("2026-01-01", -1)).toBe("2025-12-31")
    expect(addLocalCalendarDays("2026-02-28", 1)).toBe("2026-03-01")
  })
})

describe("summarizeLearningActivity", () => {
  it("returns zero-safe defaults for an empty ledger", () => {
    expect(
      summarizeLearningActivity(ledger([]), {
        now,
        dueReviewWordsNow: 0,
      }),
    ).toEqual({
      streakDays: 0,
      dailyGoal: {
        completed: 0,
        target: 15,
        percentage: 0,
        isComplete: false,
      },
      missions: {
        review: {
          completed: 0,
          target: 0,
          percentage: 0,
          isComplete: false,
          visible: false,
        },
        flashcards: {
          completed: 0,
          target: 10,
          percentage: 0,
          isComplete: false,
        },
        speak: {
          completed: 0,
          target: 1,
          percentage: 0,
          isComplete: false,
        },
      },
    })
  })

  it("counts a streak anchored on today", () => {
    const summary = summarizeLearningActivity(
      ledger([
        event("today", "2026-07-13"),
        event("yesterday", "2026-07-12"),
        event("two-days", "2026-07-11"),
      ]),
      { now, dueReviewWordsNow: 0 },
    )

    expect(summary.streakDays).toBe(3)
  })

  it("keeps a streak anchored on yesterday before today's activity", () => {
    const summary = summarizeLearningActivity(
      ledger([
        event("yesterday", "2026-07-12"),
        event("two-days", "2026-07-11"),
      ]),
      { now, dueReviewWordsNow: 0 },
    )

    expect(summary.streakDays).toBe(2)
  })

  it("resets a streak when the latest activity is older than yesterday", () => {
    const summary = summarizeLearningActivity(
      ledger([event("old", "2026-07-11")]),
      { now, dueReviewWordsNow: 0 },
    )

    expect(summary.streakDays).toBe(0)
  })

  it("counts streak continuity across month and year boundaries", () => {
    const januaryNow = new Date(2026, 0, 1, 12)
    const summary = summarizeLearningActivity(
      ledger([
        event("jan-1", "2026-01-01"),
        event("dec-31", "2025-12-31"),
        event("dec-30", "2025-12-30"),
      ]),
      { now: januaryNow, dueReviewWordsNow: 0 },
    )

    expect(summary.streakDays).toBe(3)
  })

  it("deduplicates event IDs but counts real repeated attempts", () => {
    const duplicate = event("same-id", "2026-07-13")
    const repeatedEntity = event("new-attempt", "2026-07-13", {
      entityId: duplicate.entityId,
    })

    const summary = summarizeLearningActivity(
      ledger([duplicate, { ...duplicate }, repeatedEntity]),
      { now, dueReviewWordsNow: 0 },
    )

    expect(summary.dailyGoal.completed).toBe(2)
  })

  it("includes every activity mode and caps the displayed daily goal", () => {
    const modes: LearningActivityEvent[] = [
      event("quiz", "2026-07-13"),
      event("flashcard", "2026-07-13", { mode: "flashcard" }),
      event("grammar", "2026-07-13", {
        kind: "grammar_answer",
        mode: "grammar",
      }),
      event("speak", "2026-07-13", {
        kind: "conversation_completed",
        mode: "speak",
      }),
      ...Array.from({ length: 13 }, (_, index) =>
        event(`extra-${index}`, "2026-07-13"),
      ),
    ]

    const summary = summarizeLearningActivity(ledger(modes), {
      now,
      dueReviewWordsNow: 0,
    })

    expect(summary.dailyGoal).toEqual({
      completed: 15,
      target: 15,
      percentage: 100,
      isComplete: true,
    })
  })

  it("counts unique due words and preserves the adaptive review target", () => {
    const dueWord = event("due-1", "2026-07-13", {
      mode: "flashcard",
      entityId: "word-due",
      metadata: { wasDue: true, correct: true },
    })
    const repeatedDueWord = event("due-2", "2026-07-13", {
      mode: "flashcard",
      entityId: "word-due",
      metadata: { wasDue: true, correct: false },
    })
    const notDue = event("not-due", "2026-07-13", {
      mode: "flashcard",
      metadata: { wasDue: false },
    })

    const summary = summarizeLearningActivity(
      ledger([dueWord, repeatedDueWord, notDue]),
      { now, dueReviewWordsNow: 3 },
    )

    expect(summary.missions.review).toEqual({
      completed: 1,
      target: 4,
      percentage: 25,
      isComplete: false,
      visible: true,
    })
    expect(summary.missions.flashcards.completed).toBe(3)
  })

  it("caps review target at five and hides it only when no review exists", () => {
    const reviewed = ["a", "b", "c"].map((entityId, index) =>
      event(`due-${index}`, "2026-07-13", {
        mode: "flashcard",
        entityId,
        metadata: { wasDue: true },
      }),
    )

    const visible = summarizeLearningActivity(ledger(reviewed), {
      now,
      dueReviewWordsNow: 4,
    })
    const hidden = summarizeLearningActivity(ledger([]), {
      now,
      dueReviewWordsNow: 0,
    })

    expect(visible.missions.review.target).toBe(5)
    expect(visible.missions.review.completed).toBe(3)
    expect(visible.missions.review.visible).toBe(true)
    expect(hidden.missions.review.visible).toBe(false)
  })

  it("counts only vocabulary Flashcards and unique Speak conversations", () => {
    const events = [
      ...Array.from({ length: 12 }, (_, index) =>
        event(`flash-${index}`, "2026-07-13", { mode: "flashcard" }),
      ),
      event("grammar-flash", "2026-07-13", {
        kind: "grammar_answer",
        mode: "grammar",
      }),
      event("speak-1", "2026-07-13", {
        kind: "conversation_completed",
        mode: "speak",
        entityId: "conversation-1",
      }),
      event("speak-2", "2026-07-13", {
        kind: "conversation_completed",
        mode: "speak",
        entityId: "conversation-1",
      }),
    ]

    const summary = summarizeLearningActivity(ledger(events), {
      now,
      dueReviewWordsNow: 0,
    })

    expect(summary.missions.flashcards).toEqual({
      completed: 10,
      target: 10,
      percentage: 100,
      isComplete: true,
    })
    expect(summary.missions.speak).toEqual({
      completed: 1,
      target: 1,
      percentage: 100,
      isComplete: true,
    })
  })
})
