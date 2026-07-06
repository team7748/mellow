import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import type { VocabularyItem } from "../types/vocabulary"
import { loadQuizResults } from "../utils/quiz"
import { QuizPage } from "./QuizPage"

function makeWord(id: string, word: string, thaiMeaning: string): VocabularyItem {
  return {
    id,
    sourceId: id,
    sourceScenario: "Test",
    scenario: "test",
    scenarioThai: "ทดสอบ",
    word,
    cefr: "A1",
    partOfSpeech: "n.",
    ipa: "",
    thaiReading: "",
    thaiPronunciation: "",
    thaiMeaning,
    simpleMeaning: "",
    example: `I use ${word}.`,
    exampleThai: "",
    contexts: {
      daily: { meaning: "", example: "", thaiExample: "" },
      work: { meaning: "", example: "", thaiExample: "" },
      study: { meaning: "", example: "", thaiExample: "" },
      test: { meaning: thaiMeaning, example: `I use ${word}.`, thaiExample: "" },
    },
    synonyms: [],
    commonMistake: "",
    memoryTip: "",
    allocationStatus: "Core MVP",
    memoryStatus: "New",
    nextReviewDate: "today",
    reviewCount: 0,
    correctCount: 0,
    wrongCount: 0,
  }
}

const quizWords = [
  makeWord("word_001", "job", "งาน"),
  makeWord("word_002", "work", "ทำงาน"),
  makeWord("word_003", "team", "ทีม"),
  makeWord("word_004", "skill", "ทักษะ"),
]

describe("QuizPage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("shows the not-ready message when fewer than four words are available", () => {
    render(<QuizPage words={quizWords.slice(0, 3)} />)

    expect(
      screen.getByRole("heading", { name: "Quiz ยังไม่พร้อม" }),
    ).toBeInTheDocument()
  })

  it("renders a prompt with four answer options", () => {
    render(<QuizPage words={quizWords} random={() => 0} />)

    expect(screen.getByRole("heading", { name: "Quiz Mode" })).toBeInTheDocument()
    expect(screen.getByText("job")).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: /งาน|ทำงาน|ทีม|ทักษะ/ }),
    ).toHaveLength(4)
  })

  it("shows immediate feedback and saves the selected result", async () => {
    const user = userEvent.setup()
    render(<QuizPage words={quizWords} random={() => 0} />)

    await user.click(screen.getByRole("button", { name: "งาน" }))

    expect(screen.getByText("ถูกต้อง")).toBeInTheDocument()
    expect(screen.getByText("คำตอบที่ถูก: งาน")).toBeInTheDocument()
    expect(loadQuizResults()).toEqual([
      expect.objectContaining({
        wordId: "word_001",
        isCorrect: true,
        selectedAnswer: "งาน",
        correctAnswer: "งาน",
      }),
    ])
  })

  it("disables option buttons after an answer and creates the next question on request", async () => {
    const user = userEvent.setup()
    render(<QuizPage words={quizWords} random={() => 0} />)

    await user.click(screen.getByRole("button", { name: "ทำงาน" }))

    const optionGroup = screen.getByRole("group", { name: "ตัวเลือกคำตอบ" })
    expect(
      within(optionGroup)
        .getAllByRole("button")
        .every((button) => button.hasAttribute("disabled")),
    ).toBe(true)
    expect(screen.getByText("ยังไม่ถูก")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "ข้อต่อไป" }))

    expect(screen.queryByText("ยังไม่ถูก")).not.toBeInTheDocument()
    expect(screen.getByRole("group", { name: "ตัวเลือกคำตอบ" })).toBeInTheDocument()
  })
})
