import { useEffect } from "react"
import { playCompletionJingle } from "../../utils/audioEffects"
import { PracticeResultSummary } from "../shared/PracticeResultSummary"
import type { PracticeType } from "../../hooks/useQuizSetup"
type QuizSummaryProps = {
  category: string
  categoryLabel: string
  practiceType: PracticeType
  totalAvailableWords: number
  totalQuestions: number
  correctCount: number
  wrongCount: number
  skippedCount: number
  missedWordLabels: Array<{ word: string; meaning: string }>
  onRandomNewSet: () => void
  onPracticeAgain: () => void
  onReviewMissed: () => void
  onChangeCategory: () => void
  onBackToVocabulary: () => void
}

export function QuizSummary({
  totalQuestions,
  correctCount,
  missedWordLabels,
  onPracticeAgain,
  onReviewMissed,
  onBackToVocabulary,
}: QuizSummaryProps) {
  useEffect(() => {
    // Play completion jingle on mount
    playCompletionJingle()
  }, [])

  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  const mistakes = missedWordLabels.map((m, i) => ({
    id: String(i),
    userAnswer: "",
    correctAnswer: m.word,
    reason: m.meaning,
  }))

  return (
    <PracticeResultSummary
      score={correctCount}
      total={totalQuestions}
      accuracy={accuracy}
      mistakes={mistakes}
      onReviewMissed={missedWordLabels.length > 0 ? onReviewMissed : undefined}
      onRetry={onPracticeAgain}
      onHome={onBackToVocabulary}
    />
  )
}
