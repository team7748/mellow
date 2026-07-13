import { beforeEach, describe, expect, it } from "vitest"
import { createEmptyGrammarProgressV2, createEmptyTopicProgress } from "../lib/grammarProgressStore"
import { saveProgress } from "../lib/storage"
import { getAllVocabulary } from "./vocabulary"
import {
  getGrammarProgressStats,
  getHomeProgressSummary,
  getHomeQuickReview,
} from "./homeProgress"

const NOW = new Date("2026-07-12T08:00:00.000Z")

describe("Home vocabulary data", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("reports the exact number of learned vocabulary words", () => {
    const [first, second] = getAllVocabulary()

    saveProgress({
      learnedWordIds: [first.id, second.id],
      words: {},
      updatedAt: "2026-07-12T07:00:00.000Z",
    })

    expect(getHomeProgressSummary(NOW).learnedWords).toBe(2)
  })

  it("selects the most recently studied due word for quick review", () => {
    const [first, second] = getAllVocabulary()

    saveProgress({
      learnedWordIds: [first.id, second.id],
      words: {
        [first.id]: {
          wordId: first.id,
          status: "learning",
          correctCount: 1,
          wrongCount: 0,
          lastStudiedAt: "2026-07-10T08:00:00.000Z",
          nextReviewAt: "2026-07-11T08:00:00.000Z",
          updatedAt: "2026-07-10T08:00:00.000Z",
        },
        [second.id]: {
          wordId: second.id,
          status: "review",
          correctCount: 2,
          wrongCount: 0,
          lastStudiedAt: "2026-07-12T07:30:00.000Z",
          nextReviewAt: "2026-07-12T07:45:00.000Z",
          updatedAt: "2026-07-12T07:30:00.000Z",
        },
      },
      updatedAt: "2026-07-12T07:30:00.000Z",
    })

    expect(getHomeQuickReview(NOW)).toMatchObject({
      word: { id: second.id },
      status: "review",
    })
  })

  it("returns no quick review word when progress is empty", () => {
    expect(getHomeQuickReview(NOW)).toBeNull()
  })
})

describe("getGrammarProgressStats", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("keeps accuracy unavailable until the learner has answered a question", () => {
    const progress = createEmptyGrammarProgressV2()
    const topic = createEmptyTopicProgress("topic-present-simple")
    topic.lessonViewed = true
    progress.topics[topic.topicId] = topic

    const stats = getGrammarProgressStats(progress, NOW)

    if (!stats) throw new Error("Expected grammar stats")

    expect(stats.overallAccuracy).toBeNull()
    expect(stats.questionsAnswered).toBe(0)
    expect(stats.topicsStarted).toBe(1)
  })

  it("reports only grammar flashcard reviews and their due count", () => {
    localStorage.setItem("thai_english_srs_records", JSON.stringify({
      "topic-present-simple:subject-verb": {
        wordId: "topic-present-simple:subject-verb",
        status: "learning",
        dueDate: "2026-07-12T07:00:00.000Z",
        correctCount: 2,
        wrongCount: 1,
        totalReviews: 3,
      },
      "topic-past-simple:regular-verbs": {
        wordId: "topic-past-simple:regular-verbs",
        status: "review",
        dueDate: "2026-07-12T10:00:00.000Z",
        correctCount: 1,
        wrongCount: 0,
        totalReviews: 1,
      },
      "vocabulary-word": {
        wordId: "vocabulary-word",
        status: "learning",
        dueDate: "2026-07-12T07:00:00.000Z",
        correctCount: 99,
        wrongCount: 0,
        totalReviews: 99,
      },
    }))

    const stats = getGrammarProgressStats(createEmptyGrammarProgressV2(), NOW)

    if (!stats) throw new Error("Expected grammar stats")

    expect(stats.flashcardsReviewed).toBe(4)
    expect(stats.reviewDue).toBe(2)
    expect(stats.srsTotalCards).toBe(2)
  })
})
