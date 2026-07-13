import { loadProgress } from "../lib/storage"
import { getAllSrsRecords, getSrsEnabled } from "./srsService"
import type { GrammarProgressV2 } from "../types/grammarProgress"
import { getVocabularyById } from "./vocabulary"

export const VOCABULARY_TOTAL_WORDS = 2250

export function getHomeProgressSummary(now = new Date()) {
  const progress = loadProgress()
  const learnedWordIds = new Set(progress.learnedWordIds)
  const savedProgress = Object.values(progress.words)
  
  const srsEnabled = getSrsEnabled()
  const allSrsRecords = getAllSrsRecords()
  // Filter only vocabulary SRS records (not starting with 'topic-')
  const srsRecords = allSrsRecords.filter(rec => !rec.wordId.startsWith("topic-"))
  
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  let dueNow = 0
  let dueToday = 0
  let srsLearning = 0
  let srsMastered = 0
  let srsCorrect = 0
  let srsTotal = 0

  srsRecords.forEach(rec => {
    srsCorrect += rec.correctCount
    srsTotal += rec.totalReviews
    
    if (rec.status === "learning" || rec.status === "review") srsLearning++
    if (rec.status === "mastered") srsMastered++

    const due = new Date(rec.dueDate)
    if (due <= now) dueNow++
    else if (due <= todayEnd) dueToday++
  })

  const srsAccuracy = srsTotal > 0 ? Math.round((srsCorrect / srsTotal) * 100) : 0
  
  const dueReviewWords = savedProgress.filter((word) => {
    if (word.status !== "learning" && word.status !== "review") return false
    if (!word.nextReviewAt) return true
    return new Date(word.nextReviewAt).getTime() <= now.getTime()
  }).length

  return {
    totalWords: VOCABULARY_TOTAL_WORDS,
    learnedWords: learnedWordIds.size,
    masteredWords: savedProgress.filter((word) => word.status === "mastered").length,
    dueReviewWords,
    progressPercentage:
      VOCABULARY_TOTAL_WORDS > 0
        ? Math.round((learnedWordIds.size / VOCABULARY_TOTAL_WORDS) * 100)
        : 0,
    
    // SRS stats
    srsEnabled,
    srsDueNow: dueNow,
    srsDueToday: dueToday,
    srsLearning,
    srsMastered,
    srsAccuracy,
    srsTotalWords: srsRecords.length
  }
}

export function getHomeQuickReview(now = new Date()) {
  const progress = loadProgress()
  const candidates = Object.values(progress.words)
    .filter((item) => item.status !== "new" && item.lastStudiedAt)
    .sort(
      (a, b) =>
        new Date(b.lastStudiedAt ?? 0).getTime() -
        new Date(a.lastStudiedAt ?? 0).getTime(),
    )

  const selected =
    candidates.find(
      (item) => !item.nextReviewAt || new Date(item.nextReviewAt) <= now,
    ) ?? candidates[0]

  if (!selected) return null

  const word = getVocabularyById(selected.wordId)
  return word ? { word, status: selected.status } : null
}

export function getGrammarProgressStats(grammarProgress: GrammarProgressV2 | null, now = new Date()) {
  if (!grammarProgress) {
    return null
  }

  const srsEnabled = getSrsEnabled()
  const allSrsRecords = getAllSrsRecords()
  const grammarSrsRecords = allSrsRecords.filter(rec => rec.wordId.startsWith("topic-"))

  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  let srsDueNow = 0
  let srsDueToday = 0
  let srsLearning = 0
  let srsMastered = 0
  let srsTotal = 0
  let srsCorrect = 0

  grammarSrsRecords.forEach(rec => {
    srsTotal += rec.totalReviews
    srsCorrect += rec.correctCount

    if (rec.status === "learning" || rec.status === "review") srsLearning++
    if (rec.status === "mastered") srsMastered++

    const due = new Date(rec.dueDate)
    if (due <= now) srsDueNow++
    else if (due <= todayEnd) srsDueToday++
  })

  const srsAccuracy = srsTotal > 0 ? Math.round((srsCorrect / srsTotal) * 100) : 0
  const srsTotalCards = grammarSrsRecords.length

  const topics = Object.values(grammarProgress.topics)
  const topicsStarted = topics.filter(t => t.lessonViewed || t.status !== "new").length
  const topicsCompleted = topics.filter(t => t.lessonCompleted || t.status === "mastered").length
  
  let totalQuestionsAnswered = 0
  let totalCorrectAnswers = 0
  
  topics.forEach(t => {
    totalQuestionsAnswered += t.questionsAnswered
    totalCorrectAnswers += t.correctAnswers
  })

  const overallAccuracy = totalQuestionsAnswered > 0 
    ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) 
    : null

  const weakTopics = topics
    .filter(t => t.practiceAttempts > 0 && t.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)

  const unresolvedMistakes = grammarProgress.mistakes
    .filter(m => !m.resolved)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  return {
    topicsStarted,
    topicsCompleted,
    overallAccuracy,
    questionsAnswered: totalQuestionsAnswered,
    flashcardsReviewed: srsTotal,
    reviewDue: srsDueNow + srsDueToday,
    srsEnabled,
    srsDueNow,
    srsDueToday,
    srsLearning,
    srsMastered,
    srsAccuracy,
    srsTotalCards,
    weakTopics,
    recentMistakes: unresolvedMistakes
  }
}
