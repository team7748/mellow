import { beforeEach, describe, expect, it } from "vitest"
import type { VocabularyItem } from "../types/vocabulary"
import {
  QUIZ_RESULTS_STORAGE_KEY,
  canCreateQuiz,
  createQuizQuestion,
  loadQuizResults,
  saveQuizResult,
} from "./quiz"

function makeWord(
  id: string,
  word: string,
  thaiMeaning: string,
  example = `I use ${word}.`,
): VocabularyItem {
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
    example,
    exampleThai: "",
    contexts: {
      daily: { meaning: "", example: "", thaiExample: "" },
      work: { meaning: "", example: "", thaiExample: "" },
      study: { meaning: "", example: "", thaiExample: "" },
      test: { meaning: thaiMeaning, example, thaiExample: "" },
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

const words = [
  makeWord("word_001", "job", "งาน"),
  makeWord("word_002", "work", "ทำงาน"),
  makeWord("word_003", "team", "ทีม"),
  makeWord("word_004", "skill", "ทักษะ"),
  makeWord("word_005", "price", "ราคา"),
]

describe("quiz helpers", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("reports quiz is not ready with fewer than four words", () => {
    expect(canCreateQuiz(words.slice(0, 3))).toBe(false)
    expect(createQuizQuestion(words.slice(0, 3))).toBeNull()
  })

  it("creates an English-to-Thai question with four unique Thai options", () => {
    const question = createQuizQuestion(words, {
      random: () => 0,
      preferredTypes: ["english-to-thai"],
    })

    expect(question).toMatchObject({
      type: "english-to-thai",
      wordId: "word_001",
      prompt: "job",
      correctAnswer: "งาน",
    })
    expect(question?.options).toHaveLength(4)
    expect(new Set(question?.options).size).toBe(4)
    expect(question?.options).toContain("งาน")
    expect(
      question?.options.every((option) =>
        words.some((word) => word.thaiMeaning === option),
      ),
    ).toBe(true)
  })

  it("creates a Thai-to-English question with four unique English options", () => {
    const question = createQuizQuestion(words, {
      random: () => 0,
      preferredTypes: ["thai-to-english"],
    })

    expect(question).toMatchObject({
      type: "thai-to-english",
      wordId: "word_001",
      prompt: "งาน",
      correctAnswer: "job",
    })
    expect(question?.options).toHaveLength(4)
    expect(new Set(question?.options).size).toBe(4)
    expect(question?.options).toContain("job")
    expect(
      question?.options.every((option) =>
        words.some((word) => word.word === option),
      ),
    ).toBe(true)
  })

  it("creates a sentence question only when an example exists", () => {
    const question = createQuizQuestion(words, {
      random: () => 0,
      preferredTypes: ["sentence-to-word"],
    })

    expect(question).toMatchObject({
      type: "sentence-to-word",
      prompt: "I use job.",
      correctAnswer: "job",
    })
  })

  it("does not create a sentence question for a word without an example", () => {
    const firstWordWithoutExample = [
      makeWord("word_001", "job", "งาน", ""),
      ...words.slice(1),
    ]

    const question = createQuizQuestion(firstWordWithoutExample, {
      random: () => 0,
      preferredTypes: ["sentence-to-word"],
    })

    expect(question).toBeNull()
  })

  it("returns null when duplicate answers prevent four unique options", () => {
    const duplicateMeanings = [
      makeWord("word_001", "job", "งาน"),
      makeWord("word_002", "work", "งาน"),
      makeWord("word_003", "team", "งาน"),
      makeWord("word_004", "skill", "งาน"),
    ]

    const question = createQuizQuestion(duplicateMeanings, {
      random: () => 0,
      preferredTypes: ["english-to-thai"],
    })

    expect(question).toBeNull()
  })

  it("loads an empty quiz result list when storage is malformed", () => {
    localStorage.setItem(QUIZ_RESULTS_STORAGE_KEY, "{bad json")

    expect(loadQuizResults()).toEqual([])
  })

  it("saves quiz results to LocalStorage in answer order", () => {
    saveQuizResult({
      wordId: "word_001",
      isCorrect: true,
      selectedAnswer: "งาน",
      correctAnswer: "งาน",
      answeredAt: "2026-07-06T10:00:00.000Z",
    })
    saveQuizResult({
      wordId: "word_002",
      isCorrect: false,
      selectedAnswer: "ทีม",
      correctAnswer: "ทำงาน",
      answeredAt: "2026-07-06T10:01:00.000Z",
    })

    expect(loadQuizResults()).toEqual([
      {
        wordId: "word_001",
        isCorrect: true,
        selectedAnswer: "งาน",
        correctAnswer: "งาน",
        answeredAt: "2026-07-06T10:00:00.000Z",
      },
      {
        wordId: "word_002",
        isCorrect: false,
        selectedAnswer: "ทีม",
        correctAnswer: "ทำงาน",
        answeredAt: "2026-07-06T10:01:00.000Z",
      },
    ])
  })
})
