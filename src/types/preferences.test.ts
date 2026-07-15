import { describe, expect, it } from "vitest"
import {
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
} from "./preferences"

describe("normalizeUserPreferences", () => {
  it("accepts valid persisted settings", () => {
    expect(
      normalizeUserPreferences({
        ...DEFAULT_USER_PREFERENCES,
        language: "en",
        theme: "dark",
        dailyVocabularyGoal: 25,
        dailyPracticeMinutes: 30,
      }),
    ).toMatchObject({
      language: "en",
      theme: "dark",
      dailyVocabularyGoal: 25,
      dailyPracticeMinutes: 30,
    })
  })

  it("replaces an invalid object with defaults", () => {
    expect(
      normalizeUserPreferences({
        language: "de",
        theme: "neon",
        dailyVocabularyGoal: 0,
        dailyPracticeMinutes: 999,
        speechRate: 8,
      }),
    ).toEqual(DEFAULT_USER_PREFERENCES)
  })

  it("normalizes a database time value to HH:mm", () => {
    expect(
      normalizeUserPreferences({
        ...DEFAULT_USER_PREFERENCES,
        reminderTime: "08:30:00",
      }).reminderTime,
    ).toBe("08:30")
  })
})
