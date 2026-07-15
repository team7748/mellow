export function speakText(
  text: string,
  options?: {
    lang?: string
    rate?: number
    pitch?: number
    volume?: number
    voiceUri?: string | null
  },
) {
  if (!text || text.trim().length === 0) return

  if (!("speechSynthesis" in window) || !window.speechSynthesis) {
    console.warn("Speech synthesis is not supported in this browser.")
    return
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = options?.lang ?? "en-US"
  utterance.rate = options?.rate ?? 0.85
  utterance.pitch = options?.pitch ?? 1
  utterance.volume = options?.volume ?? 1
  if (options?.voiceUri) {
    utterance.voice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.voiceURI === options.voiceUri) ?? null
  }

  window.speechSynthesis.speak(utterance)
}

export function stopSpeech() {
  if (!("speechSynthesis" in window) || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
}

export function toggleSpeech(
  text: string,
  options?: { lang?: string; rate?: number; pitch?: number; volume?: number; voiceUri?: string | null }
) {
  if (!("speechSynthesis" in window) || !window.speechSynthesis) return
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel()
  } else {
    speakText(text, options)
  }
}
