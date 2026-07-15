export type AppLanguage = "th" | "en"
export type AppTheme = "light" | "dark" | "system"
export type SpeechLocale = "en-US" | "en-GB"

export type UserPreferences = {
  dailyVocabularyGoal: number
  dailyPracticeMinutes: number
  reminderEnabled: boolean
  reminderTime: string
  timezone: string
  language: AppLanguage
  speechLocale: SpeechLocale
  speechVoiceUri: string | null
  speechRate: number
  speechAutoPlay: boolean
  theme: AppTheme
}

export type UserPreferencesRow = {
  user_id: string
  daily_vocabulary_goal: number
  daily_practice_minutes: number
  reminder_enabled: boolean
  reminder_time: string
  timezone: string
  language: AppLanguage
  speech_locale: SpeechLocale
  speech_voice_uri: string | null
  speech_rate: number
  speech_auto_play: boolean
  theme: AppTheme
  created_at?: string
  updated_at?: string
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  dailyVocabularyGoal: 10,
  dailyPracticeMinutes: 15,
  reminderEnabled: false,
  reminderTime: "19:00",
  timezone: "Asia/Bangkok",
  language: "th",
  speechLocale: "en-US",
  speechVoiceUri: null,
  speechRate: 1,
  speechAutoPlay: true,
  theme: "system",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number) {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum
}

function normalizeTime(value: unknown): string | null {
  if (typeof value !== "string") return null
  const match = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return `${match[1]}:${match[2]}`
}

function isTimezone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export function normalizeUserPreferences(value: unknown): UserPreferences {
  if (!isRecord(value)) return { ...DEFAULT_USER_PREFERENCES }

  const reminderTime = normalizeTime(value.reminderTime)
  const valid =
    isIntegerInRange(value.dailyVocabularyGoal, 1, 200) &&
    isIntegerInRange(value.dailyPracticeMinutes, 1, 240) &&
    typeof value.reminderEnabled === "boolean" &&
    reminderTime !== null &&
    isTimezone(value.timezone) &&
    (value.language === "th" || value.language === "en") &&
    (value.speechLocale === "en-US" || value.speechLocale === "en-GB") &&
    (value.speechVoiceUri === null || typeof value.speechVoiceUri === "string") &&
    typeof value.speechRate === "number" &&
    Number.isFinite(value.speechRate) &&
    value.speechRate >= 0.5 &&
    value.speechRate <= 2 &&
    typeof value.speechAutoPlay === "boolean" &&
    (value.theme === "light" || value.theme === "dark" || value.theme === "system")

  if (!valid) return { ...DEFAULT_USER_PREFERENCES }

  return {
    dailyVocabularyGoal: value.dailyVocabularyGoal as number,
    dailyPracticeMinutes: value.dailyPracticeMinutes as number,
    reminderEnabled: value.reminderEnabled as boolean,
    reminderTime,
    timezone: value.timezone as string,
    language: value.language as AppLanguage,
    speechLocale: value.speechLocale as SpeechLocale,
    speechVoiceUri: value.speechVoiceUri as string | null,
    speechRate: value.speechRate as number,
    speechAutoPlay: value.speechAutoPlay as boolean,
    theme: value.theme as AppTheme,
  }
}
