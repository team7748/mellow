import vocabularyData from "../data/vocabulary-2000.json"
import { vocabularyThaiCorrections } from "../data/vocabularyCorrections"
import {
  vocabularyEnhancements,
  normalizePartOfSpeech,
  cefrToLevel,
} from "../data/vocabularyEnhancements"
import { vocabularyExtra } from "../data/vocabularyExtra"
import { getC1C2Vocabulary } from "./c1c2Adapter"
import { clearProgress, loadProgress, saveProgress } from "../lib/storage"

import type {
  PartOfSpeech,
  ProgressStats,
  UserProgress,
  VocabCategory,
  VocabLevel,
  VocabularyItem,
  WordProgress,
  WordStatus,
} from "../types/vocabulary"

function applyThaiCorrection(word: VocabularyItem): VocabularyItem {
  const correction = vocabularyThaiCorrections[word.sourceId]

  if (!correction) {
    return word
  }

  const correctedWord: VocabularyItem = {
    ...word,
    thaiMeaning: correction.thaiMeaning,
    thaiReading: correction.thaiReading,
    thaiPronunciation: correction.thaiReading,
    exampleThai: correction.exampleThai,
    contexts: {
      ...word.contexts,
      [word.scenario]: {
        ...(word.contexts[word.scenario] ?? {
          meaning: "",
          example: word.example,
          thaiExample: "",
        }),
        meaning: correction.thaiMeaning,
        thaiExample: correction.exampleThai,
      },
    },
  }

  return correctedWord
}

/** Apply enhancement data (category, icon, level, etc.) to an existing word */
function applyEnhancement(word: VocabularyItem): VocabularyItem {
  const enhancement = vocabularyEnhancements[word.id]
  if (!enhancement) {
    // Auto-derive fields if no explicit enhancement exists
    return {
      ...word,
      level: word.level ?? cefrToLevel(word.cefr),
      partOfSpeechStandard:
        word.partOfSpeechStandard ?? normalizePartOfSpeech(word.partOfSpeech),
    }
  }

  return {
    ...word,
    category: word.category ?? enhancement.category,
    subcategory: word.subcategory ?? enhancement.subcategory,
    level: word.level ?? enhancement.level,
    partOfSpeechStandard:
      word.partOfSpeechStandard ?? enhancement.partOfSpeechStandard,
    icon: word.icon ?? enhancement.icon,
    fallbackIcon: word.fallbackIcon ?? enhancement.fallbackIcon,
    assetType: word.assetType ?? enhancement.assetType,
    assetSource: word.assetSource ?? enhancement.assetSource,
  }
}

const vocabulary: VocabularyItem[] = [
  ...(vocabularyData as unknown as VocabularyItem[])
    .map(applyThaiCorrection)
    .map(applyEnhancement),
  ...vocabularyExtra.map(applyEnhancement),
  ...getC1C2Vocabulary(),
]

function toIsoDate(date: Date) {
  return date.toISOString()
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  nextDate.setDate(date.getDate() + days)
  return nextDate
}

function createNewWordProgress(wordId: string): WordProgress {
  return {
    wordId,
    status: "new",
    correctCount: 0,
    wrongCount: 0,
    lastStudiedAt: null,
    nextReviewAt: null,
    updatedAt: new Date().toISOString(),
  }
}

function getNextReviewDate(status: WordStatus, answeredAt: Date) {
  if (status === "mastered") {
    return addDays(answeredAt, 14)
  }

  if (status === "review") {
    return addDays(answeredAt, 3)
  }

  return answeredAt
}

function getStatusFromCorrectCount(correctCount: number): WordStatus {
  if (correctCount >= 4) {
    return "mastered"
  }

  if (correctCount >= 2) {
    return "review"
  }

  return "learning"
}

function getProgressForWord(progress: UserProgress, wordId: string) {
  return progress.words[wordId] ?? createNewWordProgress(wordId)
}

export function getAllVocabulary() {
  return vocabulary
}

export function getVocabularyById(id: string) {
  return vocabulary.find((word) => word.id === id)
}

export function getWordsByStatus(status: WordStatus) {
  const progress = loadProgress()

  return vocabulary.filter((word) => getProgressForWord(progress, word.id).status === status)
}

export function getWordStatus(wordId: string): WordStatus {
  return getProgressForWord(loadProgress(), wordId).status
}

export function getReviewWords(now = new Date()) {
  const progress = loadProgress()
  const currentTime = now.getTime()

  return vocabulary.filter((word) => {
    const wordProgress = getProgressForWord(progress, word.id)

    if (wordProgress.status !== "learning" && wordProgress.status !== "review") {
      return false
    }

    if (!wordProgress.nextReviewAt) {
      return true
    }

    return new Date(wordProgress.nextReviewAt).getTime() <= currentTime
  })
}

export function updateWordProgress(
  wordId: string,
  result: boolean | "forgot" | "medium" | "known",
  answeredAt = new Date(),
) {
  const progress = loadProgress()
  const currentWordProgress = getProgressForWord(progress, wordId)
  
  const isCorrect = result === true || result === "medium" || result === "known"
  let correctCount = isCorrect ? currentWordProgress.correctCount + 1 : currentWordProgress.correctCount
  let wrongCount = isCorrect ? currentWordProgress.wrongCount : currentWordProgress.wrongCount + 1
  let difficulty = currentWordProgress.difficulty

  let status = isCorrect ? getStatusFromCorrectCount(correctCount) : "learning"

  if (result === "forgot") {
    status = "learning"
    difficulty = "forgot"
    correctCount = currentWordProgress.correctCount
    wrongCount = currentWordProgress.wrongCount + 1
  } else if (result === "medium") {
    status = "learning"
    difficulty = "medium"
    correctCount = currentWordProgress.correctCount + 1
    wrongCount = currentWordProgress.wrongCount
  } else if (result === "known") {
    status = "mastered"
    difficulty = "known"
    correctCount = currentWordProgress.correctCount + 1
    wrongCount = currentWordProgress.wrongCount
  }

  const nextProgress: WordProgress = {
    wordId,
    status,
    difficulty,
    correctCount,
    wrongCount,
    lastStudiedAt: toIsoDate(answeredAt),
    nextReviewAt: toIsoDate(getNextReviewDate(status, answeredAt)),
    updatedAt: new Date().toISOString(),
  }
  const learnedWordIds = new Set(progress.learnedWordIds)
  learnedWordIds.add(wordId)

  saveProgress({
    learnedWordIds: Array.from(learnedWordIds),
    words: {
      ...progress.words,
      [wordId]: nextProgress,
    },
    updatedAt: toIsoDate(answeredAt),
  })

  return nextProgress
}

export function resetProgress() {
  clearProgress()
}

export function calculateProgressStats(now = new Date()): ProgressStats {
  const progress = loadProgress()
  const statusCounts: Record<WordStatus, number> = {
    new: 0,
    learning: 0,
    review: 0,
    mastered: 0,
  }
  let correctAnswers = 0
  let wrongAnswers = 0

  vocabulary.forEach((word) => {
    const wordProgress = getProgressForWord(progress, word.id)
    statusCounts[wordProgress.status] += 1
    correctAnswers += wordProgress.correctCount
    wrongAnswers += wordProgress.wrongCount
  })

  return {
    totalWords: vocabulary.length,
    learnedWords: progress.learnedWordIds.length,
    newWords: statusCounts.new,
    learningWords: statusCounts.learning,
    reviewWords: statusCounts.review,
    masteredWords: statusCounts.mastered,
    dueReviewWords: getReviewWords(now).length,
    correctAnswers,
    wrongAnswers,
  }
}

// ========== New category/filter utility functions ==========

/** Get words filtered by category (supports array-based category field) */
export function getWordsByCategory(category: VocabCategory) {
  return vocabulary.filter(
    (word) => word.category?.includes(category) ?? false,
  )
}

/** Get words filtered by standardized part of speech */
export function getWordsByPartOfSpeech(pos: PartOfSpeech) {
  return vocabulary.filter((word) => word.partOfSpeechStandard === pos)
}

/** Get words filtered by level */
export function getWordsByLevel(level: VocabLevel) {
  return vocabulary.filter((word) => word.level === level)
}

/** Get all categories that have at least one word */
export function getAllCategories(): VocabCategory[] {
  const categories = new Set<VocabCategory>()
  vocabulary.forEach((word) => {
    word.category?.forEach((cat) => categories.add(cat))
  })
  return Array.from(categories).sort()
}

/** Count words per category */
export function getCategoryWordCount(): Record<string, number> {
  const counts: Record<string, number> = {}
  vocabulary.forEach((word) => {
    word.category?.forEach((cat) => {
      counts[cat] = (counts[cat] ?? 0) + 1
    })
  })
  return counts
}

/** Get all unique part-of-speech values in use */
export function getAllPartOfSpeech(): PartOfSpeech[] {
  const posSet = new Set<PartOfSpeech>()
  vocabulary.forEach((word) => {
    if (word.partOfSpeechStandard) {
      posSet.add(word.partOfSpeechStandard)
    }
  })
  return Array.from(posSet).sort()
}
