import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "./useAuth"
import { loadGrammarProgress, saveGrammarProgress, createEmptyTopicProgress, calculateMastery } from "../lib/grammarProgressStore"
import type { GrammarProgressV2, GrammarMistakeRecord } from "../types/grammarProgress"
import type { GrammarEvaluationResult } from "../data/grammar/practiceEngine"
import { recordLearningActivity } from "../lib/activity/recordLearningActivity"

export function useGrammarProgress() {
  const { user, isLoading: authLoading } = useAuth()
  const [progress, setProgress] = useState<GrammarProgressV2 | null>(null)
  const progressRef = useRef<GrammarProgressV2 | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    let isMounted = true

    setLoading(true)
    loadGrammarProgress(user?.id).then(data => {
      if (isMounted) {
        progressRef.current = data
        setProgress(data)
        setLoading(false)
      }
    })

    return () => { isMounted = false }
  }, [user, authLoading])

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const markTopicViewed = useCallback(async (topicId: string) => {
    if (!progress) return
    
    setProgress(prev => {
      if (!prev) return prev
      const next = { ...prev }
      if (!next.topics[topicId]) {
        next.topics[topicId] = createEmptyTopicProgress(topicId)
      }
      next.topics[topicId].lessonViewed = true
      saveGrammarProgress(user?.id, next)
      return next
    })
  }, [progress, user])

  const markTopicCompleted = useCallback(async (topicId: string) => {
    if (!progress) return
    
    setProgress(prev => {
      if (!prev) return prev
      const next = { ...prev }
      if (!next.topics[topicId]) {
        next.topics[topicId] = createEmptyTopicProgress(topicId)
      }
      next.topics[topicId].lessonCompleted = true
      
      const t = next.topics[topicId]
      if (t.masteryScore >= 80) {
        t.status = "mastered"
      } else if (t.status === "new") {
        t.status = "learning"
      }
      
      saveGrammarProgress(user?.id, next)
      return next
    })
  }, [progress, user])

  const recordAttempt = useCallback(async (
    topicId: string, 
    questionId: string, 
    userAnswer: string,
    correctAnswer: string,
    evaluation: GrammarEvaluationResult
  ) => {
    const current = progressRef.current
    if (!current) return

    const next: GrammarProgressV2 = {
      ...current,
      topics: { ...current.topics },
      questions: { ...current.questions },
      mistakes: [...current.mistakes],
    }
    const now = new Date().toISOString()
    const isCorrect = evaluation.correct

      // 1. Topic Progress
    const existingTopic = next.topics[topicId]
    next.topics[topicId] = existingTopic
      ? { ...existingTopic }
      : createEmptyTopicProgress(topicId)
    const t = next.topics[topicId]
      t.practiceAttempts += 1
      t.questionsAnswered += 1
      if (isCorrect) t.correctAnswers += 1
      t.lastPracticedAt = now
      t.accuracy = (t.correctAnswers / t.questionsAnswered) * 100
      t.masteryScore = calculateMastery(t.accuracy, t.practiceAttempts)
      
      if (t.masteryScore >= 80 && t.lessonCompleted) {
        t.status = "mastered"
      } else {
        t.status = "learning"
      }

      // 2. Question Progress
    const existingQuestion = next.questions[questionId]
    next.questions[questionId] = existingQuestion
      ? { ...existingQuestion }
      : {
          questionId,
          attempts: 0,
          correct: 0,
          mistakes: 0,
          lastAnsweredAt: now
        }
    const q = next.questions[questionId]
      q.attempts += 1
      q.lastAnsweredAt = now
      if (isCorrect) {
        q.correct += 1
      } else {
        q.mistakes += 1
      }

      // 3. Mistake Record
    if (!isCorrect) {
        // Prevent duplicate mistakes from same session if requested (simple check if last mistake was the same)
        const isDuplicate = next.mistakes.some(m => 
          m.questionId === questionId && m.userAnswer === userAnswer && !m.resolved
        )
        if (!isDuplicate) {
          const mistakeId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
          const newMistake: GrammarMistakeRecord = {
            id: mistakeId,
            topicId,
            questionId,
            patternId: null, // Default for now
            userAnswer,
            correctAnswer,
            errorTypes: evaluation.errorTypes,
            timestamp: now,
            resolved: false,
            reviewCount: 0
          }
          next.mistakes = [...next.mistakes, newMistake]
        }
    } else {
        // Mark old mistakes as resolved if answered correctly
        next.mistakes = next.mistakes.map(m => {
          if (m.questionId === questionId && !m.resolved) {
            return { ...m, resolved: true, reviewCount: m.reviewCount + 1 }
          }
          return m
        })
    }

    progressRef.current = next
    setProgress(next)
    await saveGrammarProgress(user?.id, next)
    recordLearningActivity({
      kind: "grammar_answer",
      mode: "grammar",
      entityId: questionId,
      metadata: { correct: isCorrect },
    })
  }, [user])

  const recordFlashcardAttempt = useCallback(async (
    topicId: string, 
    patternId: string,
    isCorrect: boolean
  ) => {
    const current = progressRef.current
    if (!current) return

    const next: GrammarProgressV2 = {
      ...current,
      topics: { ...current.topics },
      questions: { ...current.questions },
      mistakes: [...current.mistakes],
    }
    const now = new Date().toISOString()

      // 1. Topic Progress
    const existingTopic = next.topics[topicId]
    next.topics[topicId] = existingTopic
      ? { ...existingTopic }
      : createEmptyTopicProgress(topicId)
    const t = next.topics[topicId]
      t.practiceAttempts += 1
      t.questionsAnswered += 1
      if (isCorrect) t.correctAnswers += 1
      t.lastPracticedAt = now
      t.accuracy = (t.correctAnswers / t.questionsAnswered) * 100
      t.masteryScore = calculateMastery(t.accuracy, t.practiceAttempts)
      
      if (t.masteryScore >= 80 && t.lessonCompleted) {
        t.status = "mastered"
      } else {
        t.status = "learning"
      }

      // Track by patternId
    const existingQuestion = next.questions[patternId]
    next.questions[patternId] = existingQuestion
      ? { ...existingQuestion }
      : {
          questionId: patternId,
          attempts: 0,
          correct: 0,
          mistakes: 0,
          lastAnsweredAt: now
        }
    const q = next.questions[patternId]
      q.attempts += 1
      q.lastAnsweredAt = now
      if (isCorrect) {
        q.correct += 1
      } else {
        q.mistakes += 1
      }

    progressRef.current = next
    setProgress(next)
    await saveGrammarProgress(user?.id, next)
    recordLearningActivity({
      kind: "grammar_answer",
      mode: "grammar",
      entityId: patternId,
      metadata: { correct: isCorrect },
    })
  }, [user])

  return {
    progress,
    loading,
    markTopicViewed,
    markTopicCompleted,
    recordAttempt,
    recordFlashcardAttempt
  }
}
