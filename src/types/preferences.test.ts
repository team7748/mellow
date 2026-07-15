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
      dailyVocabularyGoal: 25,
      dailyPracticeMinutes: 30,
    })
    expect(normalizeUserPreferences({
      ...DEFAULT_USER_PREFERENCES,
      theme: "dark",
    })).not.toHaveProperty("theme")
  })

  it("replaces an invalid object with defaults", () => {
    expect(
      normalizeUserPreferences({
        language: "de",
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
