import { useMemo, useState, useEffect } from "react"
import { loadProgress } from "../lib/storage"
import type { CefrLevel, PartOfSpeech, VocabCategory } from "../types/vocabulary"
import type { VocabularyItem } from "../types/vocabulary"
import { getAllVocabulary } from "../utils/vocabulary"
import { getSrsEnabled, setSrsEnabled as saveSrsEnabled, sortWordIdsBySrsPriority, getSrsStatusInfo } from "../utils/srsService"

export type TrainingMode =
  | "inOrder"
  | "shuffle"
  | "reviewForgot"
  | "newOnly"
  | "learningOnly"
  | "custom-selection"

export type SetupStatus = "all" | "new" | "learning" | "mastered" | "forgot" | "srs-due-now" | "srs-due-today" | "srs-forgot"

export type SetupFilters = {
  category: "all" | VocabCategory
  cefr: "all" | CefrLevel
  partOfSpeech: "all" | PartOfSpeech
  status: SetupStatus
  searchKeyword: string
}

export const DEFAULT_FILTERS: SetupFilters = {
  category: "all",
  cefr: "all",
  partOfSpeech: "all",
  status: "all",
  searchKeyword: "",
}

export const DEFAULT_MODE: TrainingMode = "inOrder"

export const FLASHCARD_SETUP_KEY = "vocabulary_flashcard_setup"

function seededShuffle<T>(items: T[], seed: number): T[] {
  const shuffled = [...items]
  let state = seed || 1
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const swapIndex = state % (index + 1)
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ]
  }
  return shuffled
}

function safeLoadProgress() {
  try {
    return loadProgress()
  } catch {
    return { learnedWordIds: [], words: {}, updatedAt: null }
  }
}

export function useFlashcardSetup() {
  const [filters, setFilters] = useState<SetupFilters>(DEFAULT_FILTERS)
  const [mode, setModeState] = useState<TrainingMode>(DEFAULT_MODE)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([])
  const [srsEnabled, setSrsEnabledState] = useState<boolean>(getSrsEnabled())

  useEffect(() => {
    saveSrsEnabled(srsEnabled)
  }, [srsEnabled])

  const hasProgress = useMemo(() => {
    const prog = safeLoadProgress()
    return prog.learnedWordIds.length > 0
  }, [])

  // Base filtered words: applies category, cefr, pos, status, search
  const baseFilteredWords = useMemo<VocabularyItem[]>(() => {
    const allWords = getAllVocabulary()
    const normalizedSearch = filters.searchKeyword.trim().toLowerCase()

    const prog = safeLoadProgress()

    return allWords.filter((word) => {
      // Search
      if (normalizedSearch) {
        const matchesSearch =
          word.word.toLowerCase().includes(normalizedSearch) ||
          word.thaiMeaning.toLowerCase().includes(normalizedSearch) ||
          (word.category ?? []).some((c) =>
            c.toLowerCase().includes(normalizedSearch),
          ) ||
          (word.subcategory ?? "").toLowerCase().includes(normalizedSearch) ||
          word.example.toLowerCase().includes(normalizedSearch)
        if (!matchesSearch) return false
      }

      // Category
      if (filters.category !== "all") {
        if (!(word.category ?? []).includes(filters.category)) return false
      }

      // CEFR
      if (filters.cefr !== "all" && word.cefr !== filters.cefr) return false

      // Part of Speech
      if (
        filters.partOfSpeech !== "all" &&
        word.partOfSpeechStandard !== filters.partOfSpeech
      )
        return false

      // Status / Difficulty
      if (filters.status !== "all") {
        if (srsEnabled && filters.status.startsWith("srs-")) {
           const srsInfo = getSrsStatusInfo(word.id)
           if (filters.status === "srs-due-now" && !srsInfo.isDue) return false
           if (filters.status === "srs-due-today" && !srsInfo.isDueToday) return false
           // For srs-forgot we could check wrongCount > Math.max(3, correctCount)
        } else {
          const wordProg = prog.words[word.id]
          const wordStatus = wordProg?.status ?? "new"
          const wordDifficulty = wordProg?.difficulty

          if (filters.status === "forgot") {
            if (wordDifficulty !== "forgot") return false
          } else {
            if (wordStatus !== filters.status) return false
          }
        }
      }

      return true
    })
  }, [filters, srsEnabled])

  // Active words: applies training mode additional filtering/ordering on top of base
  const activeWords = useMemo<VocabularyItem[]>(() => {
    let words = [...baseFilteredWords]

    if (
      mode === "reviewForgot" ||
      mode === "newOnly" ||
      mode === "learningOnly"
    ) {
      const prog = safeLoadProgress()

      if (mode === "reviewForgot") {
        words = words.filter((w) => prog.words[w.id]?.difficulty === "forgot")
      } else if (mode === "newOnly") {
        words = words.filter(
          (w) => (prog.words[w.id]?.status ?? "new") === "new",
        )
      } else if (mode === "learningOnly") {
        words = words.filter((w) => prog.words[w.id]?.status === "learning")
      }
    } else if (mode === "shuffle") {
      words = seededShuffle(words, shuffleSeed)
    }
    // inOrder: keep as is

    return words
  }, [baseFilteredWords, mode, shuffleSeed])

  function setMode(nextMode: TrainingMode) {
    if (nextMode === "shuffle") {
      setShuffleSeed((seed) => seed + 1)
    }
    setModeState(nextMode)
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    setModeState(DEFAULT_MODE)
  }

  function updateFilter<K extends keyof SetupFilters>(
    key: K,
    value: SetupFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function toggleCustomSelection(wordId: string) {
    setCustomSelectedIds((prev) => {
      if (prev.includes(wordId)) {
        return prev.filter((id) => id !== wordId)
      }
      if (prev.length >= 50) {
        return prev // Prevent selecting more than 50
      }
      return [...prev, wordId]
    })
  }

  function selectAllCustomSelection() {
    let toSelect = baseFilteredWords.map((w) => w.id)
    if (srsEnabled) {
      toSelect = sortWordIdsBySrsPriority(toSelect)
    }
    toSelect = toSelect.slice(0, 50)
    setCustomSelectedIds(toSelect)
    return toSelect.length
  }

  function clearCustomSelection() {
    setCustomSelectedIds([])
  }

  function buildSession(wordIds: string[]) {
    let finalIds = wordIds
    if (srsEnabled) {
      finalIds = sortWordIdsBySrsPriority(wordIds)
    }

    const session = {
      filters,
      mode,
      totalWords: finalIds.length,
      selectedWordIds: finalIds,
    }
    try {
      localStorage.setItem(FLASHCARD_SETUP_KEY, JSON.stringify(session))
    } catch {
      // localStorage may be unavailable in some environments
    }
    return finalIds
  }

  function startSession(): string[] {
    if (mode === "custom-selection") {
      const selected = customSelectedIds.slice(0, 50)
      return buildSession(selected)
    }
    return buildSession(activeWords.map((word) => word.id))
  }

  function startRandom20Session(): string[] {
    const shuffled = [...activeWords].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, 20)
    return buildSession(selected.map((w) => w.id))
  }

  return {
    filters,
    mode,
    setMode,
    updateFilter,
    resetFilters,
    baseFilteredWords,
    activeWords,
    hasProgress,
    startSession,
    startRandom20Session,
    customSelectedIds,
    toggleCustomSelection,
    selectAllCustomSelection,
    clearCustomSelection,
    srsEnabled,
    setSrsEnabled: setSrsEnabledState,
  }
}
