import { render, screen, within, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { updateWordProgress } from "../utils/vocabulary"
import { VocabularyPage } from "./VocabularyPage"

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
  },
  {
    id: "word_a2_0001",
    word: "salary",
    cefr: "A2",
    partOfSpeech: "noun",
    partOfSpeechStandard: "noun",
    ipa: "/ˈsæləri/",
    thaiReading: "แฮแลรี",
    thaiPronunciation: "แฮแลรี",
    thaiMeaning: "เงินเดือน",
    simpleMeaning: "money that you receive as payment",
    example: "She has a good salary.",
    exampleThai: "เธอมีเงินเดือนที่ดี",
    category: ["School & Work"],
    tags: ["money", "work"],
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

describe("VocabularyPage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

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

  it("shows imported vocabulary cards", () => {
    installSpeechMocks()
    render(<VocabularyPage />)

    expect(screen.getByRole("heading", { name: "คลังคำศัพท์" })).toBeInTheDocument()
    expect(screen.getByText("3 คำ")).toBeInTheDocument()
    const jobCard = screen.getByLabelText("job vocabulary card")
    expect(within(jobCard).getByRole("heading", { name: "job" })).toBeInTheDocument()
    expect(within(jobCard).getByRole("button", { name: "ฟังเสียง job" })).toBeInTheDocument()
    expect(within(jobCard).getByText("/dʒɒb/")).toBeInTheDocument()
    expect(within(jobCard).getByText("School & Work")).toBeInTheDocument()
    expect(within(jobCard).getByText("ตัวอย่าง")).toBeInTheDocument()
    expect(within(jobCard).getByText("A1")).toBeInTheDocument()
    expect(within(jobCard).getByText("noun")).toBeInTheDocument()
    expect(screen.getByLabelText("สำเนียงเสียงอ่าน")).toBeInTheDocument()
    expect(screen.getByLabelText("ความเร็วเสียงอ่าน")).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: "ดูรายละเอียด" }),
    ).toHaveLength(3)
  })

  it("uses saved speech settings when a vocabulary speak button is clicked", async () => {
    const user = userEvent.setup()
    const speech = installSpeechMocks()
    render(<VocabularyPage />)

    await user.selectOptions(screen.getByLabelText("สำเนียงเสียงอ่าน"), "en-GB")
    await user.selectOptions(screen.getByLabelText("ความเร็วเสียงอ่าน"), "1.05")
    await user.click(
      within(screen.getByLabelText("job vocabulary card")).getByRole("button", {
        name: "ฟังเสียง job",
      }),
    )

    const utterance = speech.speak.mock.calls[0][0]
    expect(speech.cancel).toHaveBeenCalledTimes(1)
    expect(utterance.text).toBe("job")
    expect(utterance.lang).toBe("en-GB")
    expect(utterance.rate).toBe(1.05)
  })

  it("filters vocabulary by search text and CEFR", async () => {
    const user = userEvent.setup()
    render(<VocabularyPage />)

    await user.type(screen.getByLabelText("ค้นหาคำศัพท์"), "salary")

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "job" })).not.toBeInTheDocument()
    })
    expect(screen.getByRole("heading", { name: "salary" })).toBeInTheDocument()

    // Expand advanced filters
    await user.click(screen.getByRole("button", { name: /ตัวกรองเพิ่มเติม/ }))

    await user.selectOptions(screen.getByLabelText("ระดับ CEFR"), "A1")

    expect(screen.getByText("ไม่พบคำศัพท์ที่ตรงกับตัวกรอง")).toBeInTheDocument()
  })

  it("filters vocabulary by saved word status", async () => {
    const user = userEvent.setup()
    updateWordProgress("word_a1_0001", true, new Date("2026-07-04T08:00:00.000Z"))

    render(<VocabularyPage />)

    // Expand advanced filters
    await user.click(screen.getByRole("button", { name: /ตัวกรองเพิ่มเติม/ }))

    await user.selectOptions(screen.getByLabelText("สถานะการเรียน"), "learning")

    expect(screen.getByRole("heading", { name: "actor" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "job" })).not.toBeInTheDocument()
  })
})
