import { useState, useEffect, useRef } from "react"
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, ArrowLeft } from "lucide-react"
import { evaluateGrammarAnswer, selectGrammarSession } from "../../data/grammar/practiceEngine"
import { useGrammarProgress } from "../../hooks/useGrammarProgress"
import type { GrammarTopic } from "../../types/grammar"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { cn } from "../../utils/cn"

export function GrammarPractice({
  topic,
  onComplete,
  onQuit
}: {
  topic: GrammarTopic;
  onComplete: (result: { attempted: number; correct: number }) => void;
  onQuit: () => void;
}) {
  const [session] = useState(() => selectGrammarSession(topic.practice))
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [checked, setChecked] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [correct, setCorrect] = useState(0)
  const { recordAttempt } = useGrammarProgress()

  const question = session[index]

  const evaluation = question ? evaluateGrammarAnswer(question, answer) : { correct: false, level: "incorrect" as const, errorTypes: [] }
  const isChoice = question && (question.type === "multiple_choice" || question.type === "correct_or_incorrect" || question.type === "choose_correct_sentence")

  const advance = (skipped = false) => {
    if (!question) return
    const isCorrect = !skipped && evaluation.correct
    recordAttempt(topic.id, question.id, answer, question.answer, evaluation)
    const totalCorrect = correct + (isCorrect ? 1 : 0)
    if (index + 1 === session.length) {
      onComplete({ attempted: session.length, correct: totalCorrect })
    } else {
      setCorrect(totalCorrect)
      setIndex((value) => value + 1)
      setAnswer("")
      setChecked(false)
    }
  }

  const goBack = () => {
    if (index > 0) {
      setIndex((value) => value - 1)
      setAnswer("")
      setChecked(false)
    }
  }

  // Keyboard Navigation: Allow pressing Enter to go to next question after checking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && checked && evaluation.correct) {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, evaluation.correct, index, session.length]) // re-bind when state changes to capture current advance closure

  if (!question) {
    return (
      <section className="empty-state max-w-2xl mx-auto mt-8">
        <h2 className="text-xl font-bold text-ink-DEFAULT mb-4">ไม่มีแบบฝึกหัดในบทเรียนนี้</h2>
        <Button onClick={onQuit}>กลับไปอ่านเนื้อหา</Button>
      </section>
    )
  }

  return (
    <section className="surface-section max-w-2xl mx-auto shadow-sm border border-primary/20 p-6 sm:p-10 rounded-3xl bg-card">
      <header className="flex items-center justify-between border-b border-primary/20 pb-4">
        <button 
          type="button" 
          onClick={onQuit} 
          className="inline-flex min-h-11 items-center text-sm font-medium text-ink-secondary hover:text-ink-DEFAULT hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg -ml-3 px-3 transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4 shrink-0" /> กลับไปหน้าเนื้อหา
        </button>
        <p className="text-sm font-bold tracking-wide text-primary uppercase">
          ข้อที่ {index + 1} <span className="text-ink-secondary font-medium">/ {session.length}</span>
        </p>
      </header>
      
      <div className="mt-8 mb-10">
        <p className="text-sm tracking-wide font-semibold text-ink-secondary mb-3">{question.instructionThai}</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-DEFAULT leading-tight text-balance">
          {Array.isArray(question.question) ? question.question.join(" · ") : question.question}
        </h2>
      </div>

      {isChoice ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {question.options?.map((option) => {
            const isSelected = answer === option
            const isRightAnswer = option === question.answer
            
            let cardClass = "flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed font-medium text-base "
            
            if (checked) {
              if (isRightAnswer) {
                cardClass += "border-emerald-300 bg-primary-soft text-ink-dark ring-1 ring-primary/20 shadow-sm"
              } else if (isSelected && !isRightAnswer) {
                cardClass += "border-rose-200 bg-rose-50 text-rose-900 ring-1 ring-rose-100"
              } else {
                cardClass += "opacity-40 bg-slate-50 border-border text-ink-DEFAULT"
              }
            } else if (isSelected) {
              // Neutral Selected State
              cardClass += "border-primary bg-primary-soft text-ink-dark ring-1 ring-primary active:scale-[0.99]"
            } else {
              // Default Unselected State
              cardClass += "border-border bg-card text-ink-DEFAULT hover:border-slate-400 hover:bg-slate-50 active:scale-[0.99]"
            }

            return (
              <button 
                key={option} 
                type="button" 
                disabled={checked} 
                onClick={() => {
                  setAnswer(option)
                  setChecked(true)
                }} 
                className={cardClass}
              >
                <span className="flex-1 text-left">{option}</span>
                {checked && isRightAnswer && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                {checked && isSelected && !isRightAnswer && <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="relative mt-2">
          <Input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={checked}
            placeholder="พิมพ์คำตอบของคุณที่นี่..."
            className={cn(
              "text-lg py-4 px-4 pr-12 shadow-sm",
              checked ? (evaluation.correct ? 'border-emerald-300 bg-primary-soft text-ink-dark ring-1 ring-primary/20' : 'border-rose-300 bg-rose-50/50 text-rose-900 ring-1 ring-rose-200') : ''
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && answer.trim() && !checked) {
                setChecked(true)
              }
            }}
          />
          {checked && evaluation.correct && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />}
          {checked && !evaluation.correct && <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-rose-500" />}
        </div>
      )}

      {!checked ? (
        <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 border-t border-border pt-8">
          <Button disabled={!answer.trim()} onClick={() => setChecked(true)} className="flex items-center gap-2 px-6 py-2.5 text-base w-full sm:w-auto order-1 sm:order-none">
            ตรวจคำตอบ
          </Button>
          <Button variant="secondary" onClick={() => advance(true)} className="px-6 py-2.5 text-base text-ink-secondary w-full sm:w-auto order-2 sm:order-none">
            ข้ามข้อนี้
          </Button>
          {index > 0 && (
            <Button variant="secondary" onClick={goBack} className="px-6 py-2.5 text-base text-ink-secondary sm:ml-auto border-border w-full sm:w-auto order-3 sm:order-none">
              ข้อก่อนหน้า
            </Button>
          )}
        </div>
      ) : (
        <div className={`mt-10 rounded-2xl border p-6 sm:p-8 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${evaluation.correct ? 'bg-primary-soft border-primary/20' : 'bg-rose-50/80 border-rose-200'}`}>
          <div className="flex items-start gap-3 sm:gap-4">
            {evaluation.correct ? (
              <CheckCircle2 className="w-7 h-7 text-primary mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-7 h-7 text-rose-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${evaluation.correct ? 'text-ink-dark' : 'text-rose-950'}`}>
                {evaluation.correct ? "ถูกต้อง ยอดเยี่ยม!" : `ตอบผิด (คำตอบที่ถูกคือ: ${question.answer})`}
              </h3>
              <p className={`mt-1.5 text-base leading-relaxed ${evaluation.correct ? 'text-ink-dark' : 'text-rose-800'}`}>
                {question.explanationThai}
              </p>
              
              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
                <Button onClick={() => advance()} className="flex items-center gap-2 shadow-sm w-full sm:w-auto order-1 sm:order-none">
                  ข้อถัดไป <ArrowRight className="w-4 h-4" />
                </Button>
                {!evaluation.correct && (
                  <Button 
                    variant="secondary" 
                    onClick={() => { setAnswer(""); setChecked(false) }} 
                    className="flex items-center gap-2 bg-card text-ink-DEFAULT hover:bg-slate-50 border-border shadow-sm w-full sm:w-auto order-2 sm:order-none"
                  >
                    <RotateCcw className="w-4 h-4" /> ลองตอบใหม่
                  </Button>
                )}
                {index > 0 && (
                  <Button variant="secondary" onClick={goBack} className="flex items-center gap-2 bg-card text-ink-DEFAULT hover:bg-slate-50 border-border shadow-sm sm:ml-auto w-full sm:w-auto order-3 sm:order-none">
                    ข้อก่อนหน้า
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
