export type SpeechSettings = {
  lang: "en-US" | "en-GB"
  rate: 0.75 | 0.9 | 1.05
}

export const SPEECH_SETTINGS_STORAGE_KEY = "thai-english-vocab-speech-settings"

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  lang: "en-US",
  rate: 0.9,
}

const validLangs = ["en-US", "en-GB"] as const
const validRates = [0.75, 0.9, 1.05] as const

function isSpeechSettings(value: Partial<SpeechSettings>): value is SpeechSettings {
  return (
    validLangs.includes(value.lang as SpeechSettings["lang"]) &&
    validRates.includes(value.rate as SpeechSettings["rate"])
  )
}

export function loadSpeechSettings(): SpeechSettings {
  const rawValue = localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY)

  if (!rawValue) {
    return DEFAULT_SPEECH_SETTINGS
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SpeechSettings>
    return isSpeechSettings(parsed) ? parsed : DEFAULT_SPEECH_SETTINGS
  } catch {
    return DEFAULT_SPEECH_SETTINGS
  }
}

export function saveSpeechSettings(settings: SpeechSettings) {
  localStorage.setItem(SPEECH_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}
