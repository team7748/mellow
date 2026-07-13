import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getAllVocabulary } from "../utils/vocabulary"
import { WordDetailPage } from "./WordDetailPage"

const originalSpeechSynthesis = window.speechSynthesis
const OriginalUtterance = window.SpeechSynthesisUtterance
const detailWord = getAllVocabulary()[0]

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

describe("WordDetailPage", () => {
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

  it("shows available vocabulary detail from the current dataset", () => {
    installSpeechMocks()
    render(<WordDetailPage wordId={detailWord.id} onBack={vi.fn()} />)

    expect(screen.getByRole("heading", { name: detailWord.word })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: new RegExp(`${detailWord.word}$`) })).toBeInTheDocument()
    expect(screen.getAllByText(detailWord.thaiMeaning).length).toBeGreaterThan(0)
    expect(screen.getByText(detailWord.ipa)).toBeInTheDocument()
    expect(screen.getByText(detailWord.cefr)).toBeInTheDocument()
    expect(screen.getByText(detailWord.partOfSpeechStandard ?? detailWord.partOfSpeech)).toBeInTheDocument()
    expect(screen.getAllByText(detailWord.example).length).toBeGreaterThan(0)
    expect(screen.getAllByText(detailWord.exampleThai).length).toBeGreaterThan(0)
  })

  it("calls back when the user chooses to return to vocabulary list", async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<WordDetailPage wordId={detailWord.id} onBack={onBack} />)

    await user.click(screen.getAllByRole("button")[0])

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("speaks the main word from the word detail page", async () => {
    const user = userEvent.setup()
    const speech = installSpeechMocks()
    render(<WordDetailPage wordId={detailWord.id} onBack={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: new RegExp(`${detailWord.word}$`) }))

    const utterance = speech.speak.mock.calls[0][0]
    expect(speech.cancel).toHaveBeenCalledTimes(1)
    expect(utterance.text).toBe(detailWord.word)
  })

  it("shows a friendly empty state when the word is missing", () => {
    render(<WordDetailPage wordId="missing-word" onBack={vi.fn()} />)

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
  })
})
