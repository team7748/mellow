import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SpeakButton } from "./SpeakButton"

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

describe("SpeakButton", () => {
  afterEach(() => {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: originalSpeechSynthesis,
    })
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: OriginalUtterance,
    })
  })

  it("speaks the provided text when clicked", async () => {
    const user = userEvent.setup()
    const speech = installSpeechMocks()

    render(<SpeakButton text="job" lang="en-GB" rate={1.05} />)

    await user.click(screen.getByRole("button", { name: "ฟังเสียง job" }))

    expect(speech.cancel).toHaveBeenCalledTimes(1)
    const utterance = speech.speak.mock.calls[0][0]
    expect(utterance.text).toBe("job")
    expect(utterance.lang).toBe("en-GB")
    expect(utterance.rate).toBe(1.05)
  })

  it("does not render for empty text", () => {
    installSpeechMocks()

    const { container } = render(<SpeakButton text=" " />)

    expect(container).toBeEmptyDOMElement()
  })

  it("does not render when speech synthesis is unsupported", () => {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: undefined,
    })

    const { container } = render(<SpeakButton text="job" />)

    expect(container).toBeEmptyDOMElement()
  })
})
