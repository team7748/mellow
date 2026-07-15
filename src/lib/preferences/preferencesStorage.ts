import {
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
  type UserPreferences,
} from "../../types/preferences"

export const PREFERENCES_CACHE_PREFIX = "mellow:user-preferences:v1"
const LEGACY_SPEECH_SETTINGS_KEY = "thai-english-vocab-speech-settings"

export function getPreferencesCacheKey(scope: string): string {
  return `${PREFERENCES_CACHE_PREFIX}:${scope}`
}

function loadLegacySpeechPreferences(): UserPreferences | null {
  try {
    const rawValue = localStorage.getItem(LEGACY_SPEECH_SETTINGS_KEY)
    if (!rawValue) return null
    const parsed = JSON.parse(rawValue) as Record<string, unknown>
    const speechLocale = parsed.lang === "en-US" || parsed.lang === "en-GB"
      ? parsed.lang
      : null
    const speechRate = typeof parsed.rate === "number" && parsed.rate >= 0.5 && parsed.rate <= 2
      ? parsed.rate
      : null
    if (!speechLocale || speechRate === null) return null
    return {
      ...DEFAULT_USER_PREFERENCES,
      speechLocale,
      speechRate,
    }
  } catch {
    return null
  }
}

export function loadCachedPreferences(scope: string): UserPreferences {
  try {
    const rawValue = localStorage.getItem(getPreferencesCacheKey(scope))
    if (rawValue) return normalizeUserPreferences(JSON.parse(rawValue))

    if (scope === "guest") {
      const migrated = loadLegacySpeechPreferences()
      if (migrated) {
        saveCachedPreferences(scope, migrated)
        return migrated
      }
    }
  } catch {
    return { ...DEFAULT_USER_PREFERENCES }
  }

  return { ...DEFAULT_USER_PREFERENCES }
}

export function saveCachedPreferences(
  scope: string,
  preferences: UserPreferences,
): void {
  localStorage.setItem(
    getPreferencesCacheKey(scope),
    JSON.stringify(normalizeUserPreferences(preferences)),
  )
}
