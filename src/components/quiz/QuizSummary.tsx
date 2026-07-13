import { useEffect } from "react"
import { playCompletionJingle } from "../../utils/audioEffects"
import { PracticeResultSummary } from "../shared/PracticeResultSummary"
import type { PracticeType } from "../../hooks/useQuizSetup"
const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  multiple_choice: "เลือกคำตอบ (Multiple Choice)",
  fill_blank: "เติมคำในช่องว่าง (Fill in the Blank)",
  typing: "พิมพ์คำศัพท์ (Typing Practice)",
}

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
  categoryLabel,
  practiceType,
  totalAvailableWords,
  totalQuestions,
  correctCount,
  wrongCount,
  skippedCount,
  missedWordLabels,
  onRandomNewSet,
  onPracticeAgain,
  onReviewMissed,
  onChangeCategory,
  onBackToVocabulary,
}: QuizSummaryProps) {
  useEffect(() => {
    // Play completion jingle on mount
    playCompletionJingle()
  }, [])

  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  let feedbackText = "พยายามต่อไปนะ คุณจะเก่งขึ้นเรื่อยๆ!"
  let feedbackColor = "text-amber-600"
  if (accuracy === 100) {
    feedbackText = "ยอดเยี่ยมมาก! ตอบถูกหมดทุกข้อ 🎉"
    feedbackColor = "text-primary"
  } else if (accuracy >= 80) {
    feedbackText = "เก่งมาก! เกือบจะเต็มร้อยแล้ว"
    feedbackColor = "text-primary"
  } else if (accuracy >= 50) {
    feedbackText = "ดีมาก! ลองทบทวนคำที่ผิดแล้วมาลองใหม่นะ"
    feedbackColor = "text-primary"
  }

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
