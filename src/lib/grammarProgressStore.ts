import { supabase } from "./supabaseClient"
import type { 
  GrammarProgressV2, 
  GrammarTopicProgress, 
  GrammarMistakeRecord 
} from "../types/grammarProgress"
import { GrammarLessonProgress, getGrammarLessonProgress } from "./grammarLessonProgress"

export const GUEST_STORAGE_KEY = "grammar-progress-v2-guest"
export const AUTH_STORAGE_KEY_PREFIX = "grammar-progress-v2-"

export function getStorageKey(userId: string | undefined | null) {
  return userId ? `${AUTH_STORAGE_KEY_PREFIX}${userId}` : GUEST_STORAGE_KEY
}

export function createEmptyGrammarProgressV2(): GrammarProgressV2 {
  return {
    version: 2,
    topics: {},
    questions: {},
    patterns: {},
    mistakes: [],
    updatedAt: new Date().toISOString(),
  }
}

function migrateV1toV2(v1: GrammarLessonProgress): GrammarProgressV2 {
  const v2 = createEmptyGrammarProgressV2()
  
  // Migrate lessonViewed
  for (const topicId of v1.lessonViewed) {
    if (!v2.topics[topicId]) {
      v2.topics[topicId] = createEmptyTopicProgress(topicId)
    }
    v2.topics[topicId].lessonViewed = true
  }

  // Migrate lessonCompleted
  for (const topicId of v1.lessonCompleted) {
    if (!v2.topics[topicId]) {
      v2.topics[topicId] = createEmptyTopicProgress(topicId)
    }
    v2.topics[topicId].lessonCompleted = true
    if (v2.topics[topicId].status === "new") {
      v2.topics[topicId].status = "learning"
    }
  }

  // Migrate attempts
  for (const attempt of v1.attempts) {
    const { topicId, questionId, correct, answeredAt } = attempt
    
    // Topic
    if (!v2.topics[topicId]) {
      v2.topics[topicId] = createEmptyTopicProgress(topicId)
    }
    v2.topics[topicId].practiceAttempts += 1
    v2.topics[topicId].questionsAnswered += 1
    if (correct) {
      v2.topics[topicId].correctAnswers += 1
    }
    v2.topics[topicId].lastPracticedAt = answeredAt
    
    // Question
    if (!v2.questions[questionId]) {
      v2.questions[questionId] = {
        questionId,
        attempts: 0,
        correct: 0,
        mistakes: 0,
        lastAnsweredAt: answeredAt
      }
    }
    v2.questions[questionId].attempts += 1
    if (correct) {
      v2.questions[questionId].correct += 1
    } else {
      v2.questions[questionId].mistakes += 1
    }
    v2.questions[questionId].lastAnsweredAt = answeredAt
  }

  // Recalculate derived metrics for topics
  for (const topicId of Object.keys(v2.topics)) {
    const t = v2.topics[topicId]
    t.accuracy = t.questionsAnswered > 0 ? (t.correctAnswers / t.questionsAnswered) * 100 : 0
    t.masteryScore = calculateMastery(t.accuracy, t.practiceAttempts)
    if (t.masteryScore >= 80 && t.lessonCompleted) {
      t.status = "mastered"
    } else if (t.practiceAttempts > 0) {
      t.status = "learning"
    }
  }

  return v2
}

export function createEmptyTopicProgress(topicId: string): GrammarTopicProgress {
  return {
    topicId,
    status: "new",
    lessonViewed: false,
    lessonCompleted: false,
    practiceAttempts: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    accuracy: 0,
    masteryScore: 0,
    needsReview: false,
    lastPracticedAt: null
  }
}

export function calculateMastery(accuracy: number, attempts: number): number {
  if (attempts === 0) return 0
  const attemptWeight = Math.min(attempts / 5, 1) // Cap weight at 5 attempts
  const base = accuracy * attemptWeight
  return Math.round(base)
}

export async function loadGrammarProgress(userId: string | undefined | null): Promise<GrammarProgressV2> {
  const key = getStorageKey(userId)
  const localRaw = localStorage.getItem(key)
  
  if (localRaw) {
    try {
      const parsed = JSON.parse(localRaw)
      if (parsed.version === 2) {
        return parsed as GrammarProgressV2
      }
    } catch {
      // ignore
    }
  }

  // If Auth user and no local, try Supabase
  if (userId) {
    try {
      const { data, error } = await supabase
        .from("grammar_progress")
        .select("data")
        .eq("user_id", userId)
        .single()
      
      if (data && data.data) {
        const parsed = typeof data.data === 'string' ? JSON.parse(data.data) : data.data
        if (parsed.version === 2) {
          localStorage.setItem(key, JSON.stringify(parsed))
          return parsed as GrammarProgressV2
        }
      }
    } catch (e) {
      console.warn("Failed to fetch grammar progress from Supabase", e)
    }
  }

  // Fallback to migrating V1 if it exists
  const v1 = getGrammarLessonProgress()
  const migrated = migrateV1toV2(v1)
  
  // Save migrated data immediately
  await saveGrammarProgress(userId, migrated)
  return migrated
}

export async function saveGrammarProgress(userId: string | undefined | null, progress: GrammarProgressV2) {
  progress.updatedAt = new Date().toISOString()
  const key = getStorageKey(userId)
  const raw = JSON.stringify(progress)
  
  // Always save locally
  localStorage.setItem(key, raw)

  // Sync to Supabase if Auth
  if (userId) {
    try {
      await supabase
        .from("grammar_progress")
        .upsert({
          user_id: userId,
          data: JSON.parse(raw), // Postgres JSONB
          updated_at: progress.updatedAt
        }, { onConflict: 'user_id' })
    } catch (e) {
      console.warn("Failed to sync grammar progress to Supabase", e)
    }
  }
}
