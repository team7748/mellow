export type ReminderPreference = {
  reminder_enabled: boolean
  reminder_time: string
  timezone: string
  language: "th" | "en"
}

const reminderEnvironmentKeys = [
  "REMINDER_CRON_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "WEB_PUSH_PUBLIC_KEY",
  "WEB_PUSH_PRIVATE_KEY",
  "WEB_PUSH_SUBJECT",
] as const

type ReminderEnvironmentKey = (typeof reminderEnvironmentKeys)[number]

export type ReminderEnvironment = {
  cronSecret: string
  supabaseUrl: string
  serviceRoleKey: string
  publicKey: string
  privateKey: string
  subject: string
}

export function readReminderEnvironment(
  getEnv: (name: ReminderEnvironmentKey) => string | undefined,
): { ok: true; value: ReminderEnvironment } | { ok: false; missing: ReminderEnvironmentKey[] } {
  const values = Object.fromEntries(
    reminderEnvironmentKeys.map((name) => [name, getEnv(name)?.trim() ?? ""]),
  ) as Record<ReminderEnvironmentKey, string>
  const missing = reminderEnvironmentKeys.filter((name) => !values[name])

  if (missing.length > 0) return { ok: false, missing }

  return {
    ok: true,
    value: {
      cronSecret: values.REMINDER_CRON_SECRET,
      supabaseUrl: values.SUPABASE_URL,
      serviceRoleKey: values.SUPABASE_SERVICE_ROLE_KEY,
      publicKey: values.WEB_PUSH_PUBLIC_KEY,
      privateKey: values.WEB_PUSH_PRIVATE_KEY,
      subject: values.WEB_PUSH_SUBJECT,
    },
  }
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ""
  return { localDate: `${get("year")}-${get("month")}-${get("day")}`, localTime: `${get("hour")}:${get("minute")}` }
}

export function getDueReminder(preference: ReminderPreference, now: Date) {
  if (!preference.reminder_enabled) return null
  try {
    const local = zonedParts(now, preference.timezone)
    if (local.localTime !== preference.reminder_time.slice(0, 5)) return null
    return { localDate: local.localDate, language: preference.language }
  } catch {
    return null
  }
}

export function buildReminderPayload(language: "th" | "en") {
  return language === "en"
    ? { title: "Mellow learning reminder", body: "A few minutes of English practice keeps your momentum going.", url: "/#" }
    : { title: "Mellow เตือนเวลาเรียน", body: "ถึงเวลาฝึกภาษาอังกฤษสักนิด เพื่อรักษาความต่อเนื่องของคุณ", url: "/#" }
}

export function isExpiredPushStatus(status: number | undefined) {
  return status === 404 || status === 410
}
