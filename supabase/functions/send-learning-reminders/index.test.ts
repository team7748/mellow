import { describe, expect, it } from "vitest"
import {
  buildReminderPayload,
  getDueReminder,
  isExpiredPushStatus,
  readReminderEnvironment,
} from "./reminderLogic"

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

  it("fails closed when any server-side reminder secret is missing", () => {
    const values: Record<string, string> = {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      WEB_PUSH_PUBLIC_KEY: "public-key",
      WEB_PUSH_SUBJECT: "mailto:admin@example.com",
    }

    expect(readReminderEnvironment((name) => values[name])).toEqual({
      ok: false,
      missing: ["REMINDER_CRON_SECRET", "WEB_PUSH_PRIVATE_KEY"],
    })
  })

  it("returns only explicitly configured reminder credentials", () => {
    const values: Record<string, string> = {
      REMINDER_CRON_SECRET: "cron-secret",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      WEB_PUSH_PUBLIC_KEY: "public-key",
      WEB_PUSH_PRIVATE_KEY: "private-key",
      WEB_PUSH_SUBJECT: "mailto:admin@example.com",
    }

    expect(readReminderEnvironment((name) => values[name])).toEqual({
      ok: true,
      value: {
        cronSecret: "cron-secret",
        supabaseUrl: "https://project.supabase.co",
        serviceRoleKey: "service-role",
        publicKey: "public-key",
        privateKey: "private-key",
        subject: "mailto:admin@example.com",
      },
    })
  })
})
