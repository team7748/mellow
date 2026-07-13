import { beforeEach, describe, expect, it } from "vitest"
import {
  calculateProgressStats,
  getAllVocabulary,
  getReviewWords,
  getVocabularyById,
  getWordStatus,
  getWordsByStatus,
  resetProgress,
  updateWordProgress,
} from "./vocabulary"

describe("vocabulary utilities", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("loads the current imported vocabulary dataset", () => {
    const words = getAllVocabulary()

    expect(words).toHaveLength(2250)
    expect(words[0]).toMatchObject({
      id: "word_a1_0001",
      word: "actor",
      cefr: "A1",
    })
  })

  it("finds a vocabulary item by id", () => {
    const word = getAllVocabulary()[9]

    expect(getVocabularyById(word.id)?.word).toBe(word.word)
  })

  it("treats words without saved progress as new", () => {
    const totalWords = getAllVocabulary().length

    expect(getWordsByStatus("new")).toHaveLength(totalWords)
    expect(calculateProgressStats()).toMatchObject({
      totalWords,
      newWords: totalWords,
      learningWords: 0,
      reviewWords: 0,
      masteredWords: 0,
    })
  })

  it("moves a word through learning, review, and mastered statuses", () => {
    const word = getAllVocabulary()[0]
    const now = new Date("2026-07-04T08:00:00.000Z")

    expect(updateWordProgress(word.id, true, now).status).toBe("learning")
    expect(updateWordProgress(word.id, true, now).status).toBe("review")
    expect(updateWordProgress(word.id, true, now).status).toBe("review")
    expect(updateWordProgress(word.id, true, now).status).toBe("mastered")

    expect(getWordsByStatus("mastered").map((item) => item.id)).toContain(
      word.id,
    )
    expect(getWordStatus(word.id)).toBe("mastered")
  })

  it("moves a wrong answer back to learning and keeps it due for review", () => {
    const word = getAllVocabulary()[1]
    const now = new Date("2026-07-04T08:00:00.000Z")

    const progress = updateWordProgress(word.id, false, now)

    expect(progress).toMatchObject({
      wordId: word.id,
      status: "learning",
      correctCount: 0,
      wrongCount: 1,
    })
    expect(getReviewWords(now).map((item) => item.id)).toContain(word.id)
  })

  it("resets saved progress", () => {
    const word = getAllVocabulary()[2]
    const totalWords = getAllVocabulary().length

    updateWordProgress(word.id, true, new Date("2026-07-04T08:00:00.000Z"))
    resetProgress()

    expect(calculateProgressStats()).toMatchObject({
      learnedWords: 0,
      newWords: totalWords,
    })
  })
})
