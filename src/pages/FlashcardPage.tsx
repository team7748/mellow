import { useState } from "react"
import { FlashcardPractice, type FlashcardSessionResult } from "../components/flashcard/FlashcardPractice"
import { FlashcardSetup } from "../components/flashcard/FlashcardSetup"
import { FlashcardSummary } from "../components/flashcard/FlashcardSummary"
import { Container } from "../components/layout/Container"
import { GuestNotice } from "../components/auth/GuestNotice"
import { saveSessionLog } from "../utils/srsService"
import { FLASHCARD_SETUP_KEY } from "../hooks/useUnifiedFlashcardSetup"
import type { UnifiedFlashcard } from "../types/flashcardItem"

type FlashcardMode = "setup" | "practice" | "summary"

export function FlashcardPage() {
  const [mode, setMode] = useState<FlashcardMode>("setup")
  const [practiceCards, setPracticeCards] = useState<UnifiedFlashcard[]>([])
  const [sessionResult, setSessionResult] = useState<FlashcardSessionResult>({
    forgot: [],
    medium: [],
    known: [],
    srsAgain: [],
    srsHard: [],
    srsGood: [],
    srsEasy: [],
    loopCount: 0,
    totalCards: 0,
    srsEnabled: false,
  })

  function handleStart(cards: UnifiedFlashcard[]) {
    setPracticeCards(cards)
    setSessionResult({
      forgot: [],
      medium: [],
      known: [],
      srsAgain: [],
      srsHard: [],
      srsGood: [],
      srsEasy: [],
      loopCount: 0,
      totalCards: cards.length,
      srsEnabled: false, // will be overwritten by Practice component
    })
    setMode("practice")
  }

  function handleComplete(result: FlashcardSessionResult) {
    setSessionResult(result)
    
    let modeString = "custom-selection"
    try {
      const stored = localStorage.getItem(FLASHCARD_SETUP_KEY)
      if (stored) {
        modeString = JSON.parse(stored).mode || modeString
      }
    } catch (e) {}

    const uniqueIds = Array.from(new Set([...result.srsAgain, ...result.srsHard, ...result.srsGood, ...result.srsEasy, ...result.forgot, ...result.medium, ...result.known]))

    // Count words due within the next 24 hours (due soon)
    let nextDueSoonCount = 0;
    if (result.srsEnabled) {
      nextDueSoonCount = result.srsAgain.length + result.srsHard.length; // again (minutes) + hard (hours)
      // Words that are marked good/easy might also be due soon if they were learning and moved to 12 hours. 
      // This is a simple approximation for the session summary.
    }

    saveSessionLog({
      sessionId: `session_${Date.now()}`,
      mode: result.srsEnabled ? `${modeString}-srs` : modeString,
      date: new Date().toISOString(),
      totalWords: result.totalCards,
      rememberedCount: result.medium.length + result.known.length,
      forgottenCount: result.forgot.length,
      againCount: result.srsAgain.length,
      hardCount: result.srsHard.length,
      goodCount: result.srsGood.length,
      easyCount: result.srsEasy.length,
      loopCount: result.loopCount,
      reviewedWordIds: uniqueIds,
      nextDueSoonCount: result.srsEnabled ? nextDueSoonCount : undefined,
      srsEnabled: result.srsEnabled
    })

    setMode("summary")
  }

  function handleChangeFilters() {
    setMode("setup")
  }

  function handlePracticeAgain() {
    setSessionResult({
      forgot: [],
      medium: [],
      known: [],
      srsAgain: [],
      srsHard: [],
      srsGood: [],
      srsEasy: [],
      loopCount: 0,
      totalCards: practiceCards.length,
      srsEnabled: false,
    })
    setMode("practice")
  }

  function handleReviewMissed() {
    const missedIds = sessionResult.srsEnabled ? sessionResult.srsAgain : sessionResult.forgot
    if (missedIds.length > 0) {
      const missedCards = practiceCards.filter(c => missedIds.includes(c.id))
      setPracticeCards(missedCards)
      setSessionResult({
        forgot: [],
        medium: [],
        known: [],
        srsAgain: [],
        srsHard: [],
        srsGood: [],
        srsEasy: [],
        loopCount: 0,
        totalCards: missedCards.length,
        srsEnabled: false,
      })
      setMode("practice")
    }
  }

  function handleBackToVocabulary() {
    window.location.hash = "vocabulary"
  }

  if (mode === "setup") {
    return (
      <FlashcardSetup
        onStart={handleStart}
        onBackToVocabulary={handleBackToVocabulary}
      />
    )
  }

  if (mode === "practice") {
    return (
      <Container className="py-6 sm:py-10">
        <FlashcardPractice
          cards={practiceCards}
          onComplete={handleComplete}
          onBack={handleChangeFilters}
        />
      </Container>
    )
  }

  // mode === "summary"
  return (
    <Container className="py-6 sm:py-10">
      <GuestNotice onLoginClick={() => window.location.hash = "auth"} />
      <div className="mt-6">
        <FlashcardSummary
          cards={practiceCards}
          result={sessionResult}
          onReviewMissed={handleReviewMissed}
          onPracticeAgain={handlePracticeAgain}
          onChangeFilters={handleChangeFilters}
          onBackToVocabulary={handleBackToVocabulary}
        />
      </div>
    </Container>
  )
}
