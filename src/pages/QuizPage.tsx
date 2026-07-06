import { useMemo, useState } from "react"
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react"
import { Container } from "../components/layout/Container"
import { Button } from "../components/ui/Button"
import type { VocabularyItem } from "../types/vocabulary"
import {
  createQuizQuestion,
  saveQuizResult,
  type QuizQuestion,
} from "../utils/quiz"
import { getAllVocabulary } from "../utils/vocabulary"

type QuizPageProps = {
  words?: VocabularyItem[]
  random?: () => number
}

type AnswerState = {
  selectedAnswer: string
  isCorrect: boolean
}

function getQuestionTypeLabel(question: QuizQuestion) {
  if (question.type === "english-to-thai") return "อังกฤษ -> ไทย"
  if (question.type === "thai-to-english") return "ไทย -> อังกฤษ"

  return "ประโยค -> คำศัพท์"
}

export function QuizPage({ words = getAllVocabulary(), random }: QuizPageProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState | null>(null)
  const question = useMemo(
    () => createQuizQuestion(words, { random }),
    [words, random, questionIndex],
  )

  function answerQuestion(selectedAnswer: string) {
    if (!question || answerState) return

    const isCorrect = selectedAnswer === question.correctAnswer
    setAnswerState({ selectedAnswer, isCorrect })
    saveQuizResult({
      wordId: question.wordId,
      isCorrect,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      answeredAt: new Date().toISOString(),
    })
  }

  function goToNextQuestion() {
    setAnswerState(null)
    setQuestionIndex((index) => index + 1)
  }

  if (!question) {
    return (
      <Container className="py-8 sm:py-10">
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-leaf">
            Quiz Mode
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            Quiz ยังไม่พร้อม
          </h1>
          <p className="mt-3 text-slate-600">
            ต้องมีคำศัพท์อย่างน้อย 4 คำที่สร้างตัวเลือกไม่ซ้ำกันได้
          </p>
        </section>
      </Container>
    )
  }

  return (
    <Container className="py-8 sm:py-10">
      <section className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-leaf">
          Quiz Mode
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink sm:text-4xl">
              Quiz Mode
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-700">
              เลือกคำตอบที่ถูกต้องจากข้อมูลคำศัพท์จริง
            </p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 text-center shadow-sm ring-1 ring-slate-200 sm:min-w-28">
            <p className="text-sm font-semibold text-ink">
              {getQuestionTypeLabel(question)}
            </p>
            <p className="text-xs font-medium text-slate-500">4 ตัวเลือก</p>
          </div>
        </div>
      </section>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Question
        </p>
        <h2 className="mt-4 text-3xl font-bold leading-tight text-ink">
          {question.prompt}
        </h2>

        <div
          aria-label="ตัวเลือกคำตอบ"
          role="group"
          className="mt-6 grid gap-3 sm:grid-cols-2"
        >
          {question.options.map((option) => {
            const isSelected = answerState?.selectedAnswer === option
            const isCorrectOption =
              Boolean(answerState) && option === question.correctAnswer

            return (
              <button
                key={option}
                className={`min-h-14 rounded-lg border px-4 py-3 text-left text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-leaf focus:ring-offset-2 ${
                  isCorrectOption
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : isSelected
                      ? "border-rose-400 bg-rose-50 text-rose-800"
                      : "border-slate-200 bg-white text-ink hover:border-leaf hover:bg-emerald-50"
                }`}
                disabled={Boolean(answerState)}
                type="button"
                onClick={() => answerQuestion(option)}
              >
                {option}
              </button>
            )
          })}
        </div>

        {answerState ? (
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              {answerState.isCorrect ? (
                <CheckCircle2
                  aria-hidden="true"
                  className="h-5 w-5 text-emerald-600"
                />
              ) : (
                <XCircle aria-hidden="true" className="h-5 w-5 text-rose-600" />
              )}
              <p className="font-semibold text-ink">
                {answerState.isCorrect ? "ถูกต้อง" : "ยังไม่ถูก"}
              </p>
            </div>
            <p className="mt-2 text-slate-700">
              คำตอบที่ถูก: {question.correctAnswer}
            </p>
            <Button className="mt-4" onClick={goToNextQuestion}>
              <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />
              ข้อต่อไป
            </Button>
          </div>
        ) : null}
      </article>
    </Container>
  )
}
