import { useMemo, useState } from "react"
import { CheckCircle2, Eye, Keyboard } from "lucide-react"
import { Button } from "../ui/Button"
import type { VocabularyItem } from "../../types/vocabulary"
import { getAllVocabulary } from "../../utils/vocabulary"
import type { PracticeType } from "../../hooks/useQuizSetup"
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion"
import { FillBlankQuestion } from "./FillBlankQuestion"
import { TypingQuestion } from "./TypingQuestion"
import { recordLearningActivity } from "../../lib/activity/recordLearningActivity"

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PracticeResult = {
  correctIds: string[]
  wrongIds: string[]
  skippedIds: string[]
}

type QuizPracticeProps = {
  wordIds: string[]
  practiceType: PracticeType
  onComplete: (result: PracticeResult) => void
  onBack: () => void
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({
  current,
  total,
}: {
  current: number
  total: number
}) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-ink-DEFAULT">
          ข้อ {current + 1} / {total}
        </p>
        <p className="font-semibold text-primary">{percent}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`ความคืบหน้า ${percent}%`}
        />
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

const PRACTICE_TYPE_ICONS: Record<PracticeType, React.ReactNode> = {
  multiple_choice: <CheckCircle2 className="h-4 w-4" />,
  fill_blank: <Eye className="h-4 w-4" />,
  typing: <Keyboard className="h-4 w-4" />,
}

const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  multiple_choice: "Multiple Choice",
  fill_blank: "Fill in the Blank",
  typing: "Typing Practice",
}

export function QuizPractice({
  wordIds,
  practiceType,
  onComplete,
  onBack,
}: QuizPracticeProps) {
  const allWords = useMemo(() => getAllVocabulary(), [])

  // Resolve word objects in order
  const practiceWords = useMemo(() => {
    const wordMap = new Map(allWords.map((w) => [w.id, w]))
    return wordIds
      .map((id) => wordMap.get(id))
      .filter((w): w is VocabularyItem => w !== undefined)
  }, [wordIds, allWords])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [result, setResult] = useState<PracticeResult>({
    correctIds: [],
    wrongIds: [],
    skippedIds: [],
  })
  const [sessionId] = useState(
    () =>
      globalThis.crypto?.randomUUID?.() ??
      `quiz-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )

  const currentWord = practiceWords[currentIndex]

  function handleAnswer(isCorrect: boolean) {
    if (!currentWord) return

    const nextResult: PracticeResult = {
      ...result,
      correctIds: isCorrect
        ? [...result.correctIds, currentWord.id]
        : result.correctIds,
      wrongIds: !isCorrect
        ? [...result.wrongIds, currentWord.id]
        : result.wrongIds,
    }

    recordLearningActivity({
      kind: "vocabulary_answer",
      mode: "quiz",
      entityId: currentWord.id,
      metadata: { correct: isCorrect, sessionId },
    })

    if (currentIndex + 1 >= practiceWords.length) {
      onComplete(nextResult)
    } else {
      setResult(nextResult)
      setCurrentIndex((i) => i + 1)
    }
  }

  function handleSkip() {
    if (!currentWord) return

    const nextResult: PracticeResult = {
      ...result,
      skippedIds: [...result.skippedIds, currentWord.id],
    }

    if (currentIndex + 1 >= practiceWords.length) {
      onComplete(nextResult)
    } else {
      setResult(nextResult)
      setCurrentIndex((i) => i + 1)
    }
  }

  if (practiceWords.length === 0) {
    return (
      <div className="empty-state mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold text-ink-DEFAULT">ไม่มีคำศัพท์ในหมวดนี้</h2>
        <p className="mt-3 text-ink-secondary">ลองเลือกหมวดหมู่หรือระดับอื่นดูนะ</p>
        <Button className="mt-6" onClick={onBack}>
          กลับเลือกหมวดหมู่
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header with progress */}
      <section className="surface-section mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            {PRACTICE_TYPE_ICONS[practiceType]}
            <span>{PRACTICE_TYPE_LABELS[practiceType]}</span>
          </div>
          <Button
            variant="secondary"
            onClick={onBack}
            className="text-sm"
            aria-label="กลับไปเลือกหมวดหมู่"
          >
            เปลี่ยนหมวดหมู่
          </Button>
        </div>
        <div className="mt-3">
          <ProgressBar current={currentIndex} total={practiceWords.length} />
        </div>
      </section>

      {/* Question card */}
      <article className="surface-card p-5 sm:p-8">
        {practiceType === "multiple_choice" && (
          <MultipleChoiceQuestion
            key={currentWord.id}
            word={currentWord}
            allWords={allWords}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
          />
        )}
        {practiceType === "fill_blank" && (
          <FillBlankQuestion
            key={currentWord.id}
            word={currentWord}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
          />
        )}
        {practiceType === "typing" && (
          <TypingQuestion
            key={currentWord.id}
            word={currentWord}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
          />
        )}
      </article>
    </div>
  )
}
