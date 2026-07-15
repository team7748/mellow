export type ReminderPreference = {
  reminder_enabled: boolean
  reminder_time: string
  timezone: string
  language: "th" | "en"
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
