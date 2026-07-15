import { useContext, useState } from "react"
import { Volume2 } from "lucide-react"
import { PreferencesContext } from "../../contexts/PreferencesContext"
import { loadCachedPreferences } from "../../lib/preferences/preferencesStorage"
import { speakText } from "../../utils/speech"

type SpeakButtonProps = {
  text: string
  label?: string
  lang?: "en-US" | "en-GB"
  rate?: number
  pitch?: number
  className?: string
}

function supportsSpeechSynthesis() {
  return typeof window !== "undefined" && "speechSynthesis" in window && Boolean(window.speechSynthesis)
}

export function SpeakButton({
  className = "",
  label,
  lang,
  rate,
  pitch,
  text,
}: SpeakButtonProps) {
  const preferencesContext = useContext(PreferencesContext)
  const [isSupported] = useState(supportsSpeechSynthesis)
  const trimmedText = text.trim()

  if (!isSupported || !trimmedText) {
    return null
  }

  function handleSpeak() {
    if (!trimmedText) return

    const currentPreferences = preferencesContext?.preferences ?? loadCachedPreferences("guest")
    speakText(trimmedText, {
      lang: lang ?? currentPreferences.speechLocale,
      rate: rate ?? currentPreferences.speechRate,
      pitch,
      voiceUri: currentPreferences.speechVoiceUri,
    })
  }

  const accessibleLabel = label ?? `ฟังเสียง ${trimmedText}`

  return (
    <button
      aria-label={accessibleLabel}
      className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card p-2 text-primary transition duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary-soft active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-card disabled:text-primary disabled:opacity-50 ${className}`}
      title={accessibleLabel}
      type="button"
      onClick={handleSpeak}
    >
      <Volume2 aria-hidden="true" className="h-5 w-5" />
    </button>
  )
}
