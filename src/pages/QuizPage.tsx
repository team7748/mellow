import { useEffect, useMemo, useState } from "react"
import { QuizPractice, type PracticeResult } from "../components/quiz/QuizPractice"
import { QuizSetup } from "../components/quiz/QuizSetup"
import { QuizSummary } from "../components/quiz/QuizSummary"
import { PageContainer } from "../components/layout/PageContainer"
import type { PracticeType } from "../hooks/useQuizSetup"
import type { VocabCategory } from "../types/vocabulary"
import { categoryThaiLabels } from "../data/categoryIconMap"
import { getAllVocabulary } from "../utils/vocabulary"
import {
  QUIZ_PAGE_SESSION_KEY,
  QUIZ_PROGRESS_SESSION_KEY,
  clearPracticeSession,
  loadPracticeSession,
  savePracticeSession,
} from "../lib/practiceSessionStorage"

type QuizMode = "setup" | "practice" | "summary"

type SessionInfo = {
  category: "all" | VocabCategory
  practiceType: PracticeType
  wordIds: string[]
}

type QuizPageSession = {
  mode: "practice"
  session: SessionInfo
  practiceResult: PracticeResult
}

export function QuizPage() {
  const savedSession = loadPracticeSession<QuizPageSession>(QUIZ_PAGE_SESSION_KEY)
  const [mode, setMode] = useState<QuizMode>(() => savedSession?.mode ?? "setup")
  const [session, setSession] = useState<SessionInfo>(() => savedSession?.session ?? {
    category: "all",
    practiceType: "multiple_choice",
    wordIds: [],
  })
  const [practiceResult, setPracticeResult] = useState<PracticeResult>(() => savedSession?.practiceResult ?? {
    correctIds: [],
    wrongIds: [],
    skippedIds: [],
  })

  useEffect(() => {
    if (mode === "practice" && session.wordIds.length > 0) {
      savePracticeSession<QuizPageSession>(QUIZ_PAGE_SESSION_KEY, {
        mode,
        session,
        practiceResult,
      })
    }
  }, [mode, session, practiceResult])

  // Prevent getting stuck on practice/summary if no session (e.g. refresh)
  useEffect(() => {
    if (mode !== "setup" && session.wordIds.length === 0) {
      setMode("setup")
    }
  }, [mode, session.wordIds.length])

  const allWords = useMemo(() => getAllVocabulary(), [])

  // Compute category word count for summary
  const totalAvailableWords = useMemo(() => {
    if (session.category === "all") return allWords.length
    const cat = session.category
    return allWords.filter((w) =>
      (w.category ?? []).includes(cat),
    ).length
  }, [session.category, allWords])

  // Build missed word labels for summary
  const missedWordLabels = useMemo(() => {
    const missedIds = new Set([
      ...practiceResult.wrongIds,
      ...practiceResult.skippedIds,
    ])
    const wordMap = new Map(allWords.map((w) => [w.id, w]))
    return Array.from(missedIds)
      .map((id) => wordMap.get(id))
      .filter((w) => w !== undefined)
      .map((w) => ({ word: w.word, meaning: w.thaiMeaning }))
  }, [practiceResult, allWords])

  function handleStart(wordIds: string[]) {
    clearPracticeSession(QUIZ_PAGE_SESSION_KEY)
    clearPracticeSession(QUIZ_PROGRESS_SESSION_KEY)
    // Read current setup from the QuizSetup component via localStorage
    let category: "all" | VocabCategory = "all"
    let practiceType: PracticeType = "multiple_choice"
    try {
      const stored = localStorage.getItem("vocabulary_practice_current_session")
      if (stored) {
        const parsed = JSON.parse(stored)
        category = parsed.selectedCategory ?? "all"
        practiceType = parsed.practiceType ?? "multiple_choice"
      }
    } catch {
      // ignore
    }

    setSession({ category, practiceType, wordIds })
    setPracticeResult({ correctIds: [], wrongIds: [], skippedIds: [] })
    setMode("practice")
  }

  function handleComplete(result: PracticeResult) {
    clearPracticeSession(QUIZ_PAGE_SESSION_KEY)
    clearPracticeSession(QUIZ_PROGRESS_SESSION_KEY)
    setPracticeResult(result)
    setMode("summary")
  }

  function handleChangeCategory() {
    clearPracticeSession(QUIZ_PAGE_SESSION_KEY)
    clearPracticeSession(QUIZ_PROGRESS_SESSION_KEY)
    setMode("setup")
  }

  function handlePracticeAgain() {
    clearPracticeSession(QUIZ_PAGE_SESSION_KEY)
    clearPracticeSession(QUIZ_PROGRESS_SESSION_KEY)
    setPracticeResult({ correctIds: [], wrongIds: [], skippedIds: [] })
    setMode("practice")
  }

  function handleRandomNewSet() {
    clearPracticeSession(QUIZ_PAGE_SESSION_KEY)
    clearPracticeSession(QUIZ_PROGRESS_SESSION_KEY)
    // Re-shuffle from same category
    const categoryWordsForShuffle =
      session.category === "all"
        ? allWords
        : allWords.filter((w) => {
            const cat = session.category
            return cat !== "all" && (w.category ?? []).includes(cat)
          })

    const shuffled = [...categoryWordsForShuffle]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const newIds = shuffled.slice(0, Math.min(20, shuffled.length)).map((w) => w.id)
    setSession((prev) => ({ ...prev, wordIds: newIds }))
    setPracticeResult({ correctIds: [], wrongIds: [], skippedIds: [] })
    setMode("practice")
  }

  function handleReviewMissed() {
    const missedIds = [
      ...practiceResult.wrongIds,
      ...practiceResult.skippedIds,
    ]
    if (missedIds.length > 0) {
      clearPracticeSession(QUIZ_PAGE_SESSION_KEY)
      clearPracticeSession(QUIZ_PROGRESS_SESSION_KEY)
      setSession((prev) => ({ ...prev, wordIds: missedIds }))
      setPracticeResult({ correctIds: [], wrongIds: [], skippedIds: [] })
      setMode("practice")
    }
  }

  function handleBackToHome() {
    clearPracticeSession(QUIZ_PAGE_SESSION_KEY)
    clearPracticeSession(QUIZ_PROGRESS_SESSION_KEY)
    window.location.hash = ""
  }

  function handleBackToVocabulary() {
    clearPracticeSession(QUIZ_PAGE_SESSION_KEY)
    clearPracticeSession(QUIZ_PROGRESS_SESSION_KEY)
    window.location.hash = "vocabulary"
  }

  if (mode === "setup") {
    return <QuizSetup onStart={handleStart} onBackToHome={handleBackToHome} />
  }

  if (mode === "practice") {
    return (
      <PageContainer className="py-6 sm:py-10">
        <QuizPractice
          wordIds={session.wordIds}
          practiceType={session.practiceType}
          onComplete={handleComplete}
          onBack={handleChangeCategory}
        />
      </PageContainer>
    )
  }

  // mode === "summary"
  const categoryLabel =
    session.category === "all"
      ? "ทุกหมวดหมู่"
      : categoryThaiLabels[session.category] ?? session.category

  return (
    <PageContainer className="py-6 sm:py-10">
      <QuizSummary
        category={session.category}
        categoryLabel={categoryLabel}
        practiceType={session.practiceType}
        totalAvailableWords={totalAvailableWords}
        totalQuestions={session.wordIds.length}
        correctCount={practiceResult.correctIds.length}
        wrongCount={practiceResult.wrongIds.length}
        skippedCount={practiceResult.skippedIds.length}
        missedWordLabels={missedWordLabels}
        onRandomNewSet={handleRandomNewSet}
        onPracticeAgain={handlePracticeAgain}
        onReviewMissed={handleReviewMissed}
        onChangeCategory={handleChangeCategory}
        onBackToVocabulary={handleBackToVocabulary}
      />
    </PageContainer>
  )
}
