import { afterEach, describe, expect, it, vi } from "vitest"
import { speakText } from "./speech"

const originalSpeechSynthesis = window.speechSynthesis
const OriginalUtterance = window.SpeechSynthesisUtterance

function installSpeechMocks() {
  const cancel = vi.fn()
  const speak = vi.fn()

  class MockSpeechSynthesisUtterance {
    lang = ""
    rate = 1
    pitch = 1
    volume = 1

    constructor(public text: string) {}
  }

  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: { cancel, speak },
  })
  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    configurable: true,
    value: MockSpeechSynthesisUtterance,
  })

  return { cancel, speak }
}

describe("speakText", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: originalSpeechSynthesis,
    })
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: OriginalUtterance,
    })
  })

  it("cancels current speech before speaking with defaults", () => {
    const speech = installSpeechMocks()

    speakText("job")

    expect(speech.cancel).toHaveBeenCalledTimes(1)
    expect(speech.speak).toHaveBeenCalledTimes(1)
    const utterance = speech.speak.mock.calls[0][0]
    expect(utterance.text).toBe("job")
    expect(utterance.lang).toBe("en-US")
    expect(utterance.rate).toBe(0.85)
    expect(utterance.pitch).toBe(1)
    expect(utterance.volume).toBe(1)
  })

  it("uses custom speech options", () => {
    const speech = installSpeechMocks()

    speakText("schedule", {
      lang: "en-GB",
      rate: 1.05,
      pitch: 0.9,
      volume: 0.8,
    })

    const utterance = speech.speak.mock.calls[0][0]
    expect(utterance.lang).toBe("en-GB")
    expect(utterance.rate).toBe(1.05)
    expect(utterance.pitch).toBe(0.9)
    expect(utterance.volume).toBe(0.8)
  })

  it("does not speak empty text", () => {
    const speech = installSpeechMocks()

    speakText("   ")

    expect(speech.cancel).not.toHaveBeenCalled()
    expect(speech.speak).not.toHaveBeenCalled()
  })

  it("does not crash when speech synthesis is unsupported", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: undefined,
    })

    speakText("job")

    expect(warn).toHaveBeenCalledWith(
      "Speech synthesis is not supported in this browser.",
    )
  })
})
