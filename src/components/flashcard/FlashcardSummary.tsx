import { PracticeResultSummary } from "../shared/PracticeResultSummary"
import type { FlashcardSessionResult } from "./FlashcardPractice"
import type { UnifiedFlashcard } from "../../types/flashcardItem"
import { getSrsRecord } from "../../utils/srsService"

type FlashcardSummaryProps = {
  cards: UnifiedFlashcard[]
  result: FlashcardSessionResult
  onReviewMissed: () => void
  onPracticeAgain: () => void
  onChangeFilters: () => void
  onBackToVocabulary: () => void
}

export function FlashcardSummary({
  cards,
  result,
  onReviewMissed,
  onPracticeAgain,
  onChangeFilters,
  onBackToVocabulary,
}: FlashcardSummaryProps) {
  const { totalCards, srsEnabled } = result

  // Normal mode logic
  const normalForgotCount = result.forgot.length
  const normalMediumCount = result.medium.length
  const normalKnownCount = result.known.length
  const normalRememberedCount = normalMediumCount + normalKnownCount
  const normalRememberedPercentage = totalCards > 0 ? Math.round((normalRememberedCount / totalCards) * 100) : 0

  const srsAccuracy = totalCards > 0 ? Math.round(((result.srsHard.length + result.srsGood.length + result.srsEasy.length) / totalCards) * 100) : 0
  const accuracy = srsEnabled ? srsAccuracy : normalRememberedPercentage

  const errorBreakdown = srsEnabled ? [
    { type: 'จำไม่ได้', count: result.srsAgain.length },
    { type: 'ยาก', count: result.srsHard.length },
    { type: 'พอจำได้', count: result.srsGood.length },
    { type: 'ง่าย', count: result.srsEasy.length },
  ] : [
    { type: 'จำไม่ได้', count: normalForgotCount },
    { type: 'พอจำได้', count: normalMediumCount },
    { type: 'จำได้แล้ว', count: normalKnownCount },
  ]

  const missedIds = srsEnabled ? result.srsAgain : result.forgot
  const mistakes = missedIds.map((id) => {
    const card = cards.find((c) => c.id === id)
    return {
      id,
      userAnswer: "",
      correctAnswer: card ? card.front : id,
      reason: card ? card.back : undefined,
    }
  })

  return (
    <PracticeResultSummary
      score={srsEnabled ? (result.srsHard.length + result.srsGood.length + result.srsEasy.length) : normalRememberedCount}
      total={totalCards}
      accuracy={accuracy}
      errorBreakdown={errorBreakdown}
      mistakes={mistakes}
      onReviewMissed={missedIds.length > 0 ? onReviewMissed : undefined}
      onRetry={onPracticeAgain}
      onHome={onBackToVocabulary}
    />
  )
}
