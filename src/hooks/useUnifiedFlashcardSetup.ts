import { useMemo, useState, useEffect } from "react"
import { loadProgress } from "../lib/storage"
import type { CefrLevel, PartOfSpeech, VocabCategory, VocabularyItem } from "../types/vocabulary"
import { getAllVocabulary } from "../utils/vocabulary"
import { getSrsEnabled, setSrsEnabled as saveSrsEnabled, sortWordIdsBySrsPriority, getSrsStatusInfo } from "../utils/srsService"
import { getGrammarTopics, grammarTopicRegistry } from "../data/grammar/registry"
import { generateGrammarFlashcards } from "../data/grammar/flashcardGenerator"
import type { UnifiedFlashcard } from "../types/flashcardItem"
import type { GrammarTopic } from "../types/grammar"

export type FlashcardSource = "vocabulary" | "grammar" | "mixed"
export type TrainingMode = "inOrder" | "shuffle" | "reviewForgot" | "newOnly" | "learningOnly" | "custom-selection"
export type SetupStatus = "all" | "new" | "learning" | "mastered" | "forgot" | "srs-due-now" | "srs-due-today" | "srs-forgot" | "weak-patterns"

export type SetupFilters = {
  source: FlashcardSource
  
  // Vocab Filters
  category: "all" | VocabCategory
  cefr: "all" | CefrLevel
  partOfSpeech: "all" | PartOfSpeech
  
  // Grammar Filters
  grammarTense: "all" | "present" | "past" | "future"
  grammarTopicId: "all" | string
  
  // Common Filters
  status: SetupStatus
  searchKeyword: string
}

export const DEFAULT_FILTERS: SetupFilters = {
  source: "vocabulary",
  category: "all",
  cefr: "all",
  partOfSpeech: "all",
  grammarTense: "all",
  grammarTopicId: "all",
  status: "all",
  searchKeyword: "",
}

export const DEFAULT_MODE: TrainingMode = "inOrder"
export const FLASHCARD_SETUP_KEY = "vocabulary_flashcard_setup"

function safeLoadProgress() {
  try { return loadProgress() } catch { return { learnedWordIds: [], words: {}, updatedAt: null } }
}

export function useUnifiedFlashcardSetup() {
  const [filters, setFilters] = useState<SetupFilters>(DEFAULT_FILTERS)
  const [mode, setMode] = useState<TrainingMode>(DEFAULT_MODE)
  const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([])
  const [srsEnabled, setSrsEnabledState] = useState<boolean>(getSrsEnabled())

  const [grammarCards, setGrammarCards] = useState<UnifiedFlashcard[]>([])
  const [isLoadingGrammar, setIsLoadingGrammar] = useState(false)

  // Load from URL if present
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes("?")) {
      const params = new URLSearchParams(hash.split("?")[1])
      const statusParam = params.get("filterStatus") as SetupStatus | null
      const modeParam = params.get("mode") as TrainingMode | null

      if (statusParam) {
        setFilters(prev => ({ ...prev, status: statusParam }))
        if (statusParam.startsWith("srs-")) {
          setSrsEnabledState(true)
        }
      }
      if (modeParam) {
        setMode(modeParam)
      }
    }
  }, [])

  // Load Grammar Cards
  useEffect(() => {
    let active = true
    setIsLoadingGrammar(true)
    async function load() {
      const summaries = getGrammarTopics()
      const loaded = await Promise.all(summaries.map(s => {
        const entry = grammarTopicRegistry.find(r => r.id === s.id)
        return entry ? entry.loader() : Promise.resolve({ default: s as unknown as GrammarTopic })
      }))
      if (!active) return
      const topics = loaded.map(m => m.default)
      setGrammarCards(generateGrammarFlashcards(topics))
      setIsLoadingGrammar(false)
    }
    load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    saveSrsEnabled(srsEnabled)
  }, [srsEnabled])

  const vocabCards = useMemo<UnifiedFlashcard[]>(() => {
    const allWords = getAllVocabulary()
    return allWords.map(w => ({
      id: `vocab-${w.id}`,
      type: "vocabulary",
      front: w.word,
      back: w.thaiMeaning,
      note: w.example,
      ipa: w.ipa,
      wordId: w.id,
      cefr: w.cefr,
      partOfSpeech: w.partOfSpeechStandard,
      category: w.category
    }))
  }, [])

  // Base filtered cards
  const baseFilteredCards = useMemo<UnifiedFlashcard[]>(() => {
    const normalizedSearch = filters.searchKeyword.trim().toLowerCase()
    const prog = safeLoadProgress()

    let pool: UnifiedFlashcard[] = []
    if (filters.source === "vocabulary") pool = vocabCards
    else if (filters.source === "grammar") pool = grammarCards
    else pool = [...vocabCards, ...grammarCards] // mixed

    const allWords = getAllVocabulary()
    const wordMap = new Map(allWords.map(w => [w.id, w]))
    const summaries = getGrammarTopics()
    const topicMap = new Map(summaries.map(s => [s.id, s]))

    // We will group grammar cards by patternId so we don't return all variations in Setup
    const grammarPatternMap = new Map<string, UnifiedFlashcard[]>()
    for (const card of pool) {
      if (card.type !== "vocabulary" && card.patternId) {
        if (!grammarPatternMap.has(card.patternId)) {
          grammarPatternMap.set(card.patternId, [])
        }
        grammarPatternMap.get(card.patternId)!.push(card)
      }
    }

    const dedupedPool: UnifiedFlashcard[] = []
    const seenPatterns = new Set<string>()

    for (const card of pool) {
      if (card.type === "vocabulary") {
        dedupedPool.push(card)
      } else {
        if (card.patternId && !seenPatterns.has(card.patternId)) {
          seenPatterns.add(card.patternId)
          // Just push the first variation representing the pattern for Setup counting/filtering
          dedupedPool.push(card)
        }
      }
    }

    return dedupedPool.filter((card) => {
      // 1. Search
      if (normalizedSearch) {
        if (card.type === "vocabulary") {
          const w = wordMap.get(card.wordId!)
          if (!w) return false
          const matches = w.word.toLowerCase().includes(normalizedSearch) ||
            w.thaiMeaning.toLowerCase().includes(normalizedSearch) ||
            w.example.toLowerCase().includes(normalizedSearch)
          if (!matches) return false
        } else {
          const matches = card.front.toLowerCase().includes(normalizedSearch) ||
            card.back.toLowerCase().includes(normalizedSearch) ||
            (card.note && card.note.toLowerCase().includes(normalizedSearch))
          if (!matches) return false
        }
      }

      // 2. Filters
      if (card.type === "vocabulary") {
        const w = wordMap.get(card.wordId!)
        if (!w) return false
        if (filters.category !== "all" && !(w.category ?? []).includes(filters.category)) return false
        if (filters.cefr !== "all" && w.cefr !== filters.cefr) return false
        if (filters.partOfSpeech !== "all" && w.partOfSpeechStandard !== filters.partOfSpeech) return false
        
        const wordProg = prog.words[w.id]
        const wordStatus = wordProg?.status ?? "new"
        const wordDifficulty = wordProg?.difficulty

        // Status filter
        if (filters.status !== "all") {
          if (srsEnabled && filters.status.startsWith("srs-")) {
            const srsInfo = getSrsStatusInfo(w.id)
            if (filters.status === "srs-due-now" && !srsInfo.isDue) return false
            if (filters.status === "srs-due-today" && !srsInfo.isDueToday) return false
          } else {
            if (filters.status === "forgot") {
              if (wordDifficulty !== "forgot") return false
            } else {
              if (wordStatus !== filters.status && filters.status !== "weak-patterns") return false
            }
          }
        }

        // Mode filter (for missing legacy modes)
        if (mode === "newOnly" && wordStatus !== "new") return false
        if (mode === "learningOnly" && wordStatus !== "learning") return false
        if (mode === "reviewForgot" && wordDifficulty !== "forgot") return false

      } else {
        // Grammar Card Filters
        const t = topicMap.get(card.topicId!)
        if (!t) return false
        if (filters.grammarTense !== "all" && t.categoryId !== filters.grammarTense) return false
        if (filters.grammarTopicId !== "all" && card.topicId !== filters.grammarTopicId) return false
        
        // Grammar Status (SRS)
        if (filters.status !== "all") {
          if (srsEnabled && filters.status.startsWith("srs-")) {
            // Grammar uses patternId as SRS ID
            const srsInfo = getSrsStatusInfo(card.patternId!)
            if (filters.status === "srs-due-now" && !srsInfo.isDue) return false
            if (filters.status === "srs-due-today" && !srsInfo.isDueToday) return false
          }
        }
      }

      return true
    })
  }, [filters, srsEnabled, vocabCards, grammarCards, mode])

  const activeCards = useMemo<UnifiedFlashcard[]>(() => {
    let cards = [...baseFilteredCards]

    if (mode === "shuffle") {
      cards = [...cards].sort(() => Math.random() - 0.5)
    }

    return cards
  }, [baseFilteredCards, mode])

  function resetFilters() {
    setFilters({ ...DEFAULT_FILTERS, source: filters.source })
    setMode(DEFAULT_MODE)
  }

  function updateFilter<K extends keyof SetupFilters>(key: K, value: SetupFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function toggleCustomSelection(cardId: string) {
    setCustomSelectedIds((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId)
      if (prev.length >= 50) return prev
      return [...prev, cardId]
    })
  }

  function selectAllCustomSelection() {
    let toSelect = baseFilteredCards.map((c) => c.id)
    if (srsEnabled) {
      // sortWordIdsBySrsPriority works for any ID in SRS
      toSelect = sortWordIdsBySrsPriority(toSelect)
    }
    toSelect = toSelect.slice(0, 50)
    setCustomSelectedIds(toSelect)
    return toSelect.length
  }

  function clearCustomSelection() { setCustomSelectedIds([]) }

  function startSession(): UnifiedFlashcard[] {
    const selectedIds = mode === "custom-selection" ? customSelectedIds.slice(0, 50) : activeCards.map(c => c.id)
    return resolveFullCards(selectedIds)
  }

  function startRandom20Session(): UnifiedFlashcard[] {
    const shuffled = [...activeCards].sort(() => Math.random() - 0.5)
    const selectedIds = shuffled.slice(0, 20).map(c => c.id)
    return resolveFullCards(selectedIds)
  }

  // Resolves the list of IDs into actual cards, applying variations for grammar!
  function resolveFullCards(selectedIds: string[]): UnifiedFlashcard[] {
    const pool = [...vocabCards, ...grammarCards]
    const resolved: UnifiedFlashcard[] = []

    for (const sid of selectedIds) {
      const card = baseFilteredCards.find(c => c.id === sid)
      if (!card) continue

      if (card.type === "vocabulary") {
        resolved.push(card)
      } else {
        // Grammar card: We picked this pattern. We need to select a RANDOM variation from this pattern!
        const variations = grammarCards.filter(c => c.patternId === card.patternId)
        if (variations.length > 0) {
          const randomVariation = variations[Math.floor(Math.random() * variations.length)]
          // ensure its id is unique per session so React renders it nicely
          resolved.push({ ...randomVariation, id: `${randomVariation.patternId}_${Date.now()}_${Math.random()}` })
        }
      }
    }
    return resolved
  }

  return {
    filters,
    mode,
    setMode,
    updateFilter,
    resetFilters,
    baseFilteredCards,
    activeCards,
    startSession,
    startRandom20Session,
    customSelectedIds,
    toggleCustomSelection,
    selectAllCustomSelection,
    clearCustomSelection,
    srsEnabled,
    setSrsEnabled: setSrsEnabledState,
    isLoadingGrammar
  }
}
