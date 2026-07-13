import { parseCSV } from "./csvParser"
import type {
  ConversationCategory,
  ConversationLine,
  ConversationVocab,
  ConversationPractice,
  SpeakModeProgress,
} from "../types/conversation"

let cachedCategories: ConversationCategory[] | null = null
let cachedLines: ConversationLine[] | null = null
let cachedVocab: ConversationVocab[] | null = null
let cachedPractice: ConversationPractice[] | null = null

export async function fetchConversationCategories(): Promise<ConversationCategory[]> {
  if (cachedCategories) return cachedCategories
  try {
    const res = await fetch("/data/conversations/english_conversation_categories.csv")
    if (!res.ok) throw new Error("Failed to fetch categories")
    const text = await res.text()
    // We map keys manually or rely on parseCSV's camelCase conversion
    // The CSV has: category_id, category_title, category_thai, conversation_count, line_count, vocab_count, practice_count
    // parseCSV will convert to: categoryId, categoryTitle, categoryThai, conversationCount, lineCount, vocabCount, practiceCount
    // We need to map categoryId -> id, categoryTitle -> title, categoryThai -> thaiTitle
    const parsed = parseCSV<any>(text).map((row) => ({
      id: row.categoryId,
      title: row.categoryTitle,
      thaiTitle: row.categoryThai,
      conversationCount: row.conversationCount,
      lineCount: row.lineCount,
      vocabCount: row.vocabCount,
      practiceCount: row.practiceCount,
    }))
    cachedCategories = parsed
    return parsed
  } catch (error) {
    console.error("Error loading categories:", error)
    return []
  }
}

export async function fetchConversationLines(categoryId?: string): Promise<ConversationLine[]> {
  if (!cachedLines) {
    try {
      const res = await fetch("/data/conversations/english_conversation_lines.csv")
      if (!res.ok) throw new Error("Failed to fetch lines")
      const text = await res.text()
      cachedLines = parseCSV<ConversationLine>(text)
    } catch (error) {
      console.error("Error loading conversation lines:", error)
      return []
    }
  }
  
  if (categoryId) {
    return cachedLines.filter(line => line.categoryId === categoryId)
  }
  return cachedLines
}

export async function fetchConversationVocab(categoryId?: string): Promise<ConversationVocab[]> {
  if (!cachedVocab) {
    try {
      const res = await fetch("/data/conversations/english_conversation_vocab.csv")
      if (!res.ok) throw new Error("Failed to fetch vocab")
      const text = await res.text()
      cachedVocab = parseCSV<ConversationVocab>(text)
    } catch (error) {
      console.error("Error loading conversation vocab:", error)
      return []
    }
  }

  if (categoryId) {
    return cachedVocab.filter(v => v.categoryId === categoryId)
  }
  return cachedVocab
}

export async function fetchConversationPractice(categoryId?: string): Promise<ConversationPractice[]> {
  if (!cachedPractice) {
    try {
      const res = await fetch("/data/conversations/english_conversation_practice.csv")
      if (!res.ok) throw new Error("Failed to fetch practice questions")
      const text = await res.text()
      cachedPractice = parseCSV<ConversationPractice>(text)
    } catch (error) {
      console.error("Error loading conversation practice:", error)
      return []
    }
  }

  if (categoryId) {
    return cachedPractice.filter(p => p.categoryId === categoryId)
  }
  return cachedPractice
}

// Progress management
const PROGRESS_KEY = "speakModeProgress"

export function getSpeakModeProgress(): SpeakModeProgress {
  try {
    const data = localStorage.getItem(PROGRESS_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      if (!parsed.practiceScores) {
        parsed.practiceScores = {}
      }
      return parsed
    }
  } catch (error) {
    console.error("Failed to read speak mode progress", error)
  }
  return {
    lastCategoryId: null,
    lastConversationId: null,
    lastLineNo: null,
    completedConversations: [],
    lastPracticedDate: null,
    practiceScores: {},
  }
}

export function saveSpeakModeProgress(progress: SpeakModeProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error("Failed to save speak mode progress", error)
  }
}

export function savePracticeScore(categoryId: string, status: "correct" | "grammar_error" | "meaning_error" | "unnatural") {
  const progress = getSpeakModeProgress()
  if (!progress.practiceScores) {
    progress.practiceScores = {}
  }
  
  const currentScore = progress.practiceScores[categoryId] || { correctCount: 0, errorCount: 0, grammarErrorCount: 0 }
  
  if (status === "correct" || status === "unnatural") {
    currentScore.correctCount += 1
  } else if (status === "grammar_error") {
    currentScore.grammarErrorCount += 1
    currentScore.errorCount += 1
  } else {
    currentScore.errorCount += 1
  }
  
  progress.practiceScores[categoryId] = currentScore
  progress.lastPracticedDate = new Date().toISOString()
  
  saveSpeakModeProgress(progress)
}
