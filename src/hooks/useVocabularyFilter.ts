import { useMemo, useDeferredValue } from "react"
import type { CefrLevel, PartOfSpeech, VocabCategory, VocabLevel, WordStatus } from "../types/vocabulary"
import { getAllVocabulary, getWordsByStatus } from "../utils/vocabulary"

export type FilterState = {
  searchTerm: string
  selectedCefr: "all" | CefrLevel
  selectedStatus: "all" | WordStatus
  selectedCategory: "all" | VocabCategory
  selectedPos: "all" | PartOfSpeech
  selectedLevel: "all" | VocabLevel
}

export function useVocabularyFilter(filters: FilterState) {
  const deferredFilters = useDeferredValue(filters)

  const {
    searchTerm,
    selectedCefr,
    selectedStatus,
    selectedCategory,
    selectedPos,
    selectedLevel,
  } = deferredFilters

  const filteredWords = useMemo(() => {
    const baseWords =
      selectedStatus === "all" ? getAllVocabulary() : getWordsByStatus(selectedStatus)
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()

    return baseWords.filter((word) => {
      const matchesSearch =
        !normalizedSearchTerm ||
        word.word.toLowerCase().includes(normalizedSearchTerm) ||
        word.thaiMeaning.toLowerCase().includes(normalizedSearchTerm) ||
        (word.category ?? []).some((cat) =>
          cat.toLowerCase().includes(normalizedSearchTerm),
        ) ||
        (word.subcategory ?? "").toLowerCase().includes(normalizedSearchTerm) ||
        word.example.toLowerCase().includes(normalizedSearchTerm)

      const matchesCefr = selectedCefr === "all" || word.cefr === selectedCefr

      const matchesCategory =
        selectedCategory === "all" ||
        (word.category ?? []).includes(selectedCategory)

      const matchesPos =
        selectedPos === "all" || word.partOfSpeechStandard === selectedPos

      const matchesLevel =
        selectedLevel === "all" || word.level === selectedLevel

      return matchesSearch && matchesCefr && matchesCategory && matchesPos && matchesLevel
    })
  }, [
    searchTerm,
    selectedCefr,
    selectedStatus,
    selectedCategory,
    selectedPos,
    selectedLevel,
  ])

  return filteredWords
}
