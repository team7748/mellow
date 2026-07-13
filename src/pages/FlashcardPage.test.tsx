import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { loadProgress } from "../lib/storage"
import { getAllVocabulary, updateWordProgress } from "../utils/vocabulary"
import { FlashcardPage } from "./FlashcardPage"

const mockVocabulary = [
  {
    id: "word_a1_0001",
    word: "actor",
    cefr: "A1",
    partOfSpeech: "noun",
    partOfSpeechStandard: "noun",
    ipa: "/ˈæktər/",
    thaiReading: "แอกเตอร์",
    thaiPronunciation: "แอกเตอร์",
    thaiMeaning: "นักแสดง",
    simpleMeaning: "a person whose profession is acting",
    example: "He is my favorite actor.",
    exampleThai: "เขาคือนักแสดงคนโปรดของฉัน",
    category: ["School & Work"],
    tags: ["work", "job", "entertainment"],
  },
  {
    id: "word_a1_0286",
    word: "job",
    cefr: "A1",
    partOfSpeech: "noun",
    partOfSpeechStandard: "noun",
    ipa: "/dʒɒb/",
    thaiReading: "จ็อบ",
    thaiPronunciation: "จ็อบ",
    thaiMeaning: "งาน",
    simpleMeaning: "the regular work that a person does to earn money",
    example: "I am looking for a new job.",
    exampleThai: "ฉันกำลังหางานใหม่",
    category: ["School & Work"],
    tags: ["work", "job"],
  }
]

vi.mock("../utils/vocabulary", async (importOriginal) => {
  const original = await importOriginal<typeof import("../utils/vocabulary")>()
  return {
    ...original,
    getAllVocabulary: () => mockVocabulary,
  }
})

const originalSpeechSynthesis = window.speechSynthesis
const OriginalUtterance = window.SpeechSynthesisUtterance
const [firstWord, secondWord] = getAllVocabulary()

function installSpeechMocks() {
  class MockSpeechSynthesisUtterance {
    lang = ""
    rate = 1
    pitch = 1
    volume = 1

    constructor(public text: string) {}
  }

  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: { cancel: vi.fn(), speak: vi.fn() },
  })
  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    configurable: true,
    value: MockSpeechSynthesisUtterance,
  })
}

function makeWordDue(wordId: string, isCorrect = false) {
  updateWordProgress(wordId, isCorrect ? "known" : "forgot", new Date("2026-07-04T08:00:00.000Z"))
}

async function startPractice(user: any) {
  const startBtn = await screen.findByRole("button", { name: /เริ่มฝึก/ })
  await user.click(startBtn)
}

describe("FlashcardPage", () => {
  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: originalSpeechSynthesis,
    })
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: OriginalUtterance,
    })
  })

  it("starts with new words when there are no due review words", async () => {
    const user = userEvent.setup()
    render(<FlashcardPage />)
    await startPractice(user)

    expect(screen.getByRole("heading", { name: firstWord.word })).toBeInTheDocument()
  })

  it("shows a clear listen control for the current flashcard word", async () => {
    const user = userEvent.setup()
    installSpeechMocks()

    render(<FlashcardPage />)
    await startPractice(user)

    expect(
      screen.getByRole("button", { name: `ฟังเสียง ${firstWord.word}` }),
    ).toBeInTheDocument()
  })

  it("shows the English word first and reveals Thai meaning, IPA, and example after flipping", async () => {
    const user = userEvent.setup()
    makeWordDue(firstWord.id)

    render(<FlashcardPage />)
    await user.click(screen.getByRole("radio", { name: /ฝึกเฉพาะคำที่จำไม่ได้/ }))
    await startPractice(user)

    expect(screen.getByRole("heading", { name: firstWord.word })).toBeInTheDocument()
    expect(screen.getByText("1 / 1")).toBeInTheDocument()
    expect(screen.queryByText(firstWord.thaiMeaning)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /พลิกการ์ด/ }))

    expect(screen.getByText(firstWord.thaiMeaning)).toBeInTheDocument()
    expect(screen.getByText(firstWord.ipa)).toBeInTheDocument()
    expect(screen.getByText(firstWord.example)).toBeInTheDocument()
  })

  it("stores a correct answer and advances to the next due word", async () => {
    const user = userEvent.setup()
    makeWordDue(firstWord.id)
    makeWordDue(secondWord.id)

    render(<FlashcardPage />)
    await user.click(screen.getByRole("radio", { name: /ฝึกเฉพาะคำที่จำไม่ได้/ }))
    await startPractice(user)

    await user.click(screen.getByRole("button", { name: /พลิกการ์ด/ }))
    await user.click(screen.getByRole("button", { name: /ปัดขวา: จำได้แล้ว|จำได้แล้ว/ }))

    const progress = loadProgress()
    expect(progress.words[firstWord.id].correctCount).toBe(1)
    expect(progress.words[firstWord.id].wrongCount).toBe(1)
    expect(screen.getByRole("heading", { name: secondWord.word })).toBeInTheDocument()
    expect(screen.getByText("2 / 2")).toBeInTheDocument()
  })

  it("stores an incorrect answer, requeues the card, and shows finished state after answering correctly", async () => {
    const user = userEvent.setup()
    makeWordDue(firstWord.id)

    render(<FlashcardPage />)
    await user.click(screen.getByRole("radio", { name: /ฝึกเฉพาะคำที่จำไม่ได้/ }))
    await startPractice(user)

    // First attempt: incorrect
    await user.click(screen.getByRole("button", { name: /พลิกการ์ด/ }))
    await user.click(screen.getByRole("button", { name: /ปัดซ้าย: ยังจำไม่ได้|ยังจำไม่ได้/ }))

    // Card should be requeued, so we see it again
    // We must use findByRole because advance uses a setTimeout for animation
    const flipButton = await screen.findByRole("button", { name: /พลิกการ์ด/ })
    await user.click(flipButton)

    // Second attempt: correct
    await user.click(screen.getByRole("button", { name: /ปัดขวา: จำได้แล้ว|จำได้แล้ว/ }))

    // Wait for the finish screen (also animated)
    const summaryHeading = await screen.findByRole("heading", { name: "สรุปผลการฝึก" })
    expect(summaryHeading).toBeInTheDocument()

    const progress = loadProgress()
    expect(progress.words[firstWord.id].correctCount).toBe(1)
    expect(progress.words[firstWord.id].wrongCount).toBe(2) // 1 from makeWordDue, 1 from practice
    expect(screen.getByText("ทั้งหมด")).toBeInTheDocument()
  })
})
