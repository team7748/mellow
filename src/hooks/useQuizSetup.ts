import { useMemo, useState } from "react"
import type { VocabCategory, VocabularyItem } from "../types/vocabulary"
import { getAllVocabulary } from "../utils/vocabulary"

export type PracticeType = "multiple_choice" | "fill_blank" | "typing"

export const QUESTIONS_PER_SET = 20

export const PRACTICE_SESSION_KEY = "vocabulary_practice_current_session"

export function useQuizSetup() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | VocabCategory>("all")
  const [practiceType, setPracticeType] = useState<PracticeType>("multiple_choice")

  const categoryWords = useMemo<VocabularyItem[]>(() => {
    const allWords = getAllVocabulary()

    if (selectedCategory === "all") {
      return allWords
    }

    return allWords.filter((word) =>
      (word.category ?? []).includes(selectedCategory),
    )
  }, [selectedCategory])

  function updateCategory(cat: "all" | VocabCategory) {
    setSelectedCategory(cat)
  }

  function updatePracticeType(type: PracticeType) {
    setPracticeType(type)
  }

  function resetFilters() {
    setSelectedCategory("all")
    setPracticeType("multiple_choice")
  }

  function generatePracticeSet(): string[] {
    // Fisher-Yates shuffle on a copy
    const shuffled = [...categoryWords]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const count = Math.min(QUESTIONS_PER_SET, shuffled.length)
    const selected = shuffled.slice(0, count)
    const wordIds = selected.map((w) => w.id)

    const session = {
      selectedCategory,
      practiceType,
      totalQuestions: wordIds.length,
      selectedWordIds: wordIds,
    }

    try {
      localStorage.setItem(PRACTICE_SESSION_KEY, JSON.stringify(session))
    } catch {
      // localStorage may be unavailable in some environments
    }

    return wordIds
  }

  return {
    selectedCategory,
    practiceType,
    categoryWords,
    updateCategory,
    updatePracticeType,
    resetFilters,
    generatePracticeSet,
  }
}
