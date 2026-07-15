import { describe, expect, it } from "vitest"
import { buildReminderPayload, getDueReminder, isExpiredPushStatus } from "./reminderLogic"

describe("learning reminder schedule", () => {
  const now = new Date("2026-07-15T01:30:00.000Z")

  it("matches the exact configured minute in the user's IANA timezone", () => {
    expect(getDueReminder({ reminder_enabled: true, reminder_time: "08:30:00", timezone: "Asia/Bangkok", language: "th" }, now)).toEqual({ localDate: "2026-07-15", language: "th" })
    expect(getDueReminder({ reminder_enabled: true, reminder_time: "08:31", timezone: "Asia/Bangkok", language: "th" }, now)).toBeNull()
    expect(getDueReminder({ reminder_enabled: false, reminder_time: "08:30", timezone: "Asia/Bangkok", language: "th" }, now)).toBeNull()
  })

  it("builds localized Thai and English payloads", () => {
    expect(buildReminderPayload("th").body).toContain("ภาษาอังกฤษ")
    expect(buildReminderPayload("en").body).toContain("English")
    expect(buildReminderPayload("en").url).toBe("/#")
  })

  it("classifies provider expiration responses", () => {
    expect(isExpiredPushStatus(404)).toBe(true)
    expect(isExpiredPushStatus(410)).toBe(true)
    expect(isExpiredPushStatus(500)).toBe(false)
  })
})
