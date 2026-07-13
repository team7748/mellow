import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { VocabularyItem } from "../types/vocabulary"
import { VocabularyPage } from "./VocabularyPage"

const mockWords = vi.hoisted<VocabularyItem[]>(() => [
  {
    id: "word-1",
    sourceId: "source-1",
    sourceScenario: "daily",
    scenario: "jobInterview",
    scenarioThai: "daily",
    word: "ability",
    cefr: "A1",
    partOfSpeech: "noun",
    ipa: "/əˈbɪləti/",
    thaiReading: "อะบิลิตี้",
    thaiPronunciation: "อะ-บิ-ลิ-ที",
    thaiMeaning: "ความสามารถ",
    simpleMeaning: "the power to do something",
    example: "She has the ability to learn quickly.",
    exampleThai: "เธอมีความสามารถในการเรียนรู้เร็ว",
    contexts: {
      daily: {
        meaning: "can do something",
        example: "I have the ability to cook.",
        thaiExample: "ฉันมีความสามารถในการทำอาหาร",
      },
      work: {
        meaning: "skill at work",
        example: "This job needs communication ability.",
        thaiExample: "งานนี้ต้องใช้ความสามารถในการสื่อสาร",
      },
      study: {
        meaning: "learning skill",
        example: "Reading ability improves with practice.",
        thaiExample: "ความสามารถในการอ่านดีขึ้นจากการฝึก",
      },
    },
    synonyms: ["skill"],
    commonMistake: "",
    memoryTip: "",
    allocationStatus: "Core MVP",
    memoryStatus: "New",
    nextReviewDate: "",
    reviewCount: 0,
    correctCount: 0,
    wrongCount: 0,
    category: ["Daily Life"],
    subcategory: "basic",
    level: 1,
    partOfSpeechStandard: "noun",
    assetType: "none",
    assetSource: "none",
  },
])

vi.mock("../utils/vocabulary", async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    getAllVocabulary: () => mockWords,
    getWordsByStatus: () => mockWords,
    getWordStatus: () => "new",
  }
})

describe("VocabularyPage hardening", () => {
  it("offers a clear action to reset filters from the empty state", async () => {
    const user = userEvent.setup()
    render(<VocabularyPage />)

    const searchInput = screen.getByRole("searchbox")
    await user.type(searchInput, "zzzz-not-found")

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "ล้างตัวกรองทั้งหมด" })).toBeInTheDocument()
    })
    await user.click(screen.getByRole("button", { name: "ล้างตัวกรองทั้งหมด" }))

    expect(searchInput).toHaveValue("")
    expect(screen.getByText("ability")).toBeInTheDocument()
  })
})
