import { useCallback, useState, useEffect, useRef } from "react"
import { Volume2, ChevronRight, ChevronLeft, CheckCircle, Info, FastForward, PlayCircle, AlertCircle, Lightbulb, RotateCcw, XCircle, Loader2, BookOpen } from "lucide-react"
import { Button } from "../ui/Button"
import type { ConversationPractice } from "../../types/conversation"
import { speakText, toggleSpeech } from "../../utils/speech"
import { playCorrectSound, playIncorrectSound } from "../../utils/audioEffects"
import { checkSpeakAnswer } from "../../services/speakAnswerService"
import { savePracticeScore } from "../../utils/conversationData"
import type { SpeakAnswerEvaluation } from "../../types/speakAnswerEvaluation"
import { speakCategoryToGrammarTopic } from "../../data/speak/grammarMapping"
import { getGrammarTopicSummary } from "../../data/grammar/registry"
import { GrammarMiniPractice } from "./GrammarMiniPractice"

type InteractivePracticePlayerProps = {
  categoryTitle: string
  questions: ConversationPractice[]
  onComplete?: () => void
}

const feedbackStyles = {
  correct: {
    title: "ถูกต้อง! คำตอบของคุณสื่อความหมายได้ดีและใช้ไวยากรณ์ถูกต้อง",
    panel: "bg-primary-soft text-ink-dark",
    icon: CheckCircle,
  },
  grammar_error: {
    title: "เกือบถูกแล้ว แต่ยังมีจุดที่ต้องแก้ด้านไวยากรณ์",
    panel: "bg-orange-50 text-orange-950",
    icon: XCircle,
  },
  meaning_error: {
    title: "คำตอบยังไม่ตรงกับคำถาม ลองอ่านสถานการณ์อีกครั้ง",
    panel: "bg-rose-50 text-rose-950",
    icon: AlertCircle,
  },
  unnatural: {
    title: "เข้าใจได้ แต่ยังไม่เป็นธรรมชาติ",
    panel: "bg-amber-50 text-amber-950",
    icon: Lightbulb,
  },
}

function HighlightedAnswer({ answer, errorPart }: { answer: string; errorPart: string }) {
  if (!errorPart) return <>{answer}</>
  
  // Use regex to find the exact phrase ignoring case
  const regex = new RegExp(`(${errorPart.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'i')
  const parts = answer.split(regex)
  
  if (parts.length === 1) return <>{answer}</> // Not found
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === errorPart.toLowerCase() 
          ? <mark key={i} className="rounded bg-orange-200 px-0.5 text-inherit">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

function AnswerEvaluationFeedback({
  evaluation,
  answer,
  onTryAgain,
  onListen,
  onPracticeGrammar,
  relatedTopicName,
}: {
  evaluation: SpeakAnswerEvaluation
  answer: string
  onTryAgain: () => void
  onListen: () => void
  onPracticeGrammar?: () => void
  relatedTopicName?: string
}) {
  const style = feedbackStyles[evaluation.status]
  const Icon = style.icon

  return (
    <section className={`mt-4 rounded-lg p-4 ${style.panel}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{style.title}</p>

          {evaluation.status !== "correct" && (
            <div className="mt-3 space-y-2 text-sm">
              <p><span className="font-semibold">คำตอบของคุณ:</span> <HighlightedAnswer answer={answer} errorPart={evaluation.errorPart} /></p>
              {evaluation.correctedAnswer && <p><span className="font-semibold">ประโยคที่แนะนำ:</span> {evaluation.correctedAnswer}</p>}
              {evaluation.explanationThai && <p><span className="font-semibold">คำอธิบาย:</span> {evaluation.explanationThai}</p>}
              {evaluation.hintThai && <p><span className="font-semibold">คำใบ้:</span> {evaluation.hintThai}</p>}
              {evaluation.acceptedExamples.length > 0 && (
                <div>
                  <p className="font-semibold">ตัวอย่างคำตอบที่ถูกต้อง:</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {evaluation.acceptedExamples.map((example) => <li key={example}>{example}</li>)}
                  </ul>
                </div>
              )}
              {evaluation.status === "grammar_error" && relatedTopicName && (
                <div className="mt-2 text-orange-800 bg-orange-100/50 p-3 rounded-lg border border-orange-200">
                  <p className="font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Related Grammar: {relatedTopicName}
                  </p>
                  <p className="text-sm mt-1 text-orange-700">คุณสามารถฝึกไวยากรณ์เรื่องนี้สั้นๆ เพื่อให้เข้าใจมากขึ้นได้ครับ</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {evaluation.correctedAnswer && (
              <Button variant="secondary" onClick={onListen} className="w-full sm:w-auto">
                <PlayCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                ฟังประโยคที่แนะนำ
              </Button>
            )}
            {evaluation.status !== "correct" && (
              <Button variant="secondary" onClick={onTryAgain} className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                ลองตอบใหม่
              </Button>
            )}
            {evaluation.status === "grammar_error" && onPracticeGrammar && (
              <Button onClick={onPracticeGrammar} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white">
                <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                Practice Grammar
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}



export function InteractivePracticePlayer({
  categoryTitle,
  questions,
  onComplete,
}: InteractivePracticePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<Record<number, { text: string; evaluation: SpeakAnswerEvaluation | null }>>({})
  const currentHistory = history[currentIndex] || { text: "", evaluation: null }
  const answer = currentHistory.text
  const evaluation = currentHistory.evaluation
  const [isChecking, setIsChecking] = useState(false)
  const [checkError, setCheckError] = useState("")
  const [showExample, setShowExample] = useState(false)
  const [showGrammarPractice, setShowGrammarPractice] = useState(false)
  const answerInputRef = useRef<HTMLTextAreaElement>(null)
  const [speed, setSpeed] = useState<number>(() => {
    const saved = localStorage.getItem("speakModeSpeed")
    return saved ? Number(saved) : 0.8
  })

  const currentQuestion = questions?.[currentIndex]

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      onComplete?.()
    }
  }, [currentIndex, onComplete, questions.length])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  // Persist speed
  useEffect(() => {
    localStorage.setItem("speakModeSpeed", speed.toString())
  }, [speed])

  const updateHistory = (text: string, evalData: SpeakAnswerEvaluation | null = null) => {
    setHistory((prev) => ({
      ...prev,
      [currentIndex]: { text, evaluation: evalData },
    }))
  }

  // Reset states on question change
  useEffect(() => {
    setCheckError("")
    setShowExample(false)
  }, [currentIndex])

  const lastPlayedIndexRef = useRef<number>(-1)
  
  // Auto-play audio on question change
  useEffect(() => {
    if (!currentQuestion) return;
    if (lastPlayedIndexRef.current !== currentIndex) {
      lastPlayedIndexRef.current = currentIndex
      try {
        speakText(currentQuestion.questionEnglish, { rate: speed })
      } catch {
        // Ignore autoplay errors if browser blocks it
      }
    }
  }, [currentIndex, currentQuestion, speed])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!currentQuestion) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return

      if (e.code === "ArrowRight") {
        e.preventDefault()
        handleNext()
      } else if (e.code === "ArrowLeft") {
        e.preventDefault()
        handlePrevious()
      } else if (e.code === "Space") {
        e.preventDefault()
        toggleSpeech(currentQuestion.questionEnglish, { rate: speed })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentQuestion, handleNext, handlePrevious, speed])

  if (!questions || questions.length === 0) {
    return <div className="p-4 text-center">No questions available.</div>
  }

  const relatedTopicId = speakCategoryToGrammarTopic[currentQuestion.categoryId]
  const relatedTopicName = relatedTopicId ? getGrammarTopicSummary(relatedTopicId)?.name : undefined

  if (showGrammarPractice && relatedTopicId) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <GrammarMiniPractice 
          topicId={relatedTopicId} 
          onComplete={() => setShowGrammarPractice(false)} 
          onClose={() => setShowGrammarPractice(false)} 
        />
      </div>
    )
  }

  const handleListenQuestion = () => {
    speakText(currentQuestion.questionEnglish, { rate: speed })
  }

  const handleListenExample = () => {
    const text = currentQuestion.answerExample || "This is a natural example answer."
    speakText(text, { rate: speed })
  }

  const handleCheckAnswer = async () => {
    if (!answer.trim() || isChecking) return

    setIsChecking(true)
    setCheckError("")

    try {
      const result = await checkSpeakAnswer({
        questionEnglish: currentQuestion.questionEnglish,
        questionThai: currentQuestion.questionThai,
        answerExample: currentQuestion.answerExample,
        usefulPhrases: currentQuestion.usefulPhrases,
        userAnswer: answer,
      })
      updateHistory(answer, result)
      if (result.status === "correct") playCorrectSound()
      else playIncorrectSound()

      savePracticeScore(currentQuestion.categoryId, result.status)
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : "ยังตรวจคำตอบไม่ได้ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsChecking(false)
    }
  }

  const handleTryAgain = () => {
    updateHistory(answer, null)
    setCheckError("")
    answerInputRef.current?.focus()
  }

  const insertPhrase = (phrase: string) => {
    const newAnswer = (answer ? answer + " " + phrase : phrase) + " "
    updateHistory(newAnswer)
  }

  const wordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length
  const isAnswerEmpty = answer.trim().length === 0

  return (
    <div className="flex flex-col space-y-6 w-full max-w-2xl mx-auto">
      {/* Card 1: Question Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-border flex justify-between items-center">
          <span className="text-sm font-semibold text-ink-secondary">{categoryTitle}</span>
          <span className="text-sm font-medium text-ink-secondary">
            Question {currentIndex + 1}/{questions.length}
          </span>
        </div>
        <div className="p-5 md:p-6">
          <h3 className="text-xl md:text-2xl font-bold text-ink-DEFAULT mb-2">
            {currentQuestion.questionEnglish}
          </h3>
          <p className="text-ink-secondary mb-6">{currentQuestion.questionThai}</p>
          
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" onClick={handleListenQuestion} className="gap-2">
              <Volume2 className="w-5 h-5" />
              Listen Question
            </Button>
            
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 rounded-lg p-1.5 border border-border mt-2 sm:mt-0">
              <FastForward className="w-4 h-4 text-ink-secondary ml-1" />
              <span className="text-sm text-ink-secondary font-medium mr-1">Speed:</span>
              {[0.6, 0.8, 1.0, 1.2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                    speed === s
                      ? "bg-primary text-white shadow-sm"
                      : "text-ink-secondary hover:bg-slate-200"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Answer Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="flex justify-between items-end mb-2">
            <label htmlFor="answer-input" className="font-semibold text-ink-DEFAULT">
              Your Answer
            </label>
            <span className="text-xs font-medium text-ink-secondary bg-slate-100 px-2 py-1 rounded-full">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
          </div>
          
          <textarea
            id="answer-input"
            ref={answerInputRef}
            rows={4}
            value={answer}
            onChange={(e) => {
              updateHistory(e.target.value)
              setCheckError("")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleCheckAnswer()
              }
            }}
            disabled={isChecking}
            placeholder="Type your answer here..."
            className="w-full border border-border rounded-lg p-3 text-ink-DEFAULT focus:ring-2 focus:ring-primary focus:border-primary resize-none mb-3"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />

          {/* Useful phrases */}
          <div className="mb-5">
            <p className="text-xs text-ink-secondary font-medium mb-2">Useful phrases:</p>
            <div className="flex flex-wrap gap-2">
              {(currentQuestion.usefulPhrases?.split('|') || ["I think...", "Because..."]).map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => insertPhrase(phrase)}
                  disabled={isChecking}
                  className="text-xs bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-3 py-1 hover:bg-sky-100 transition-colors active:scale-95"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button 
              variant="secondary" 
              onClick={handleCheckAnswer}
              disabled={isAnswerEmpty || isChecking || Boolean(evaluation)}
              className="gap-2 sm:w-auto w-full active:scale-[0.98] transition-transform"
            >
              {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {isChecking ? "Checking..." : "Check Answer"}
            </Button>
          </div>

          {isChecking && (
            <div
              className="mt-4 flex items-center gap-3 rounded-lg bg-primary-soft px-4 py-3 text-ink-dark min-h-[4.5rem] animate-in fade-in slide-in-from-bottom-2 duration-200"
              data-testid="speak-answer-loading-panel"
              role="status"
              aria-live="polite"
            >
              <span className="flex shrink-0 gap-1" aria-hidden="true">
                <i className="block w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <i className="block w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <i className="block w-2 h-2 rounded-full bg-primary animate-bounce" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">กำลังวิเคราะห์คำตอบ…</p>
                <p className="mt-0.5 text-sm text-ink-dark">ตรวจความหมายและไวยากรณ์ให้คุณอยู่</p>
              </div>
            </div>
          )}

          {checkError && (
            <div className="mt-4 rounded-lg bg-rose-50 p-4 text-rose-800" role="alert">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="font-semibold">{checkError}</p>
              </div>
              <Button variant="secondary" onClick={handleTryAgain} className="mt-3 w-full sm:w-auto">
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                ลองตอบใหม่
              </Button>
            </div>
          )}

          {evaluation && (
            <AnswerEvaluationFeedback 
              evaluation={evaluation} 
              answer={answer} 
              onTryAgain={handleTryAgain} 
              onListen={() => speakText(evaluation.correctedAnswer || currentQuestion.answerExample || answer, { rate: speed })} 
              onPracticeGrammar={relatedTopicId ? () => setShowGrammarPractice(true) : undefined}
              relatedTopicName={relatedTopicName}
            />
          )}
        </div>
      </div>

      {/* Card 3: Example & Navigation Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-5 md:p-6">
          {!showExample ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 w-full">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowExample(true)}
                  className="gap-2 border-border text-ink-DEFAULT hover:bg-slate-50 w-full sm:w-auto min-h-[48px] rounded-lg px-4 font-semibold"
                >
                  <Info className="w-5 h-5" />
                  Show Example Answer
                </Button>
                {isAnswerEmpty && (
                  <span className="hidden sm:inline-block text-sm text-ink-secondary italic">
                    Type your answer first, then check it.
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2">
              <h4 className="font-semibold text-ink-DEFAULT mb-2">Example Answer:</h4>
              <div className="bg-primary-soft border border-primary/20 rounded-lg p-4 mb-4">
                <p className="text-ink-DEFAULT text-lg">
                  {currentQuestion.answerExample || "I usually wake up around 7:00 AM, make some coffee, and check my emails before heading to work."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" onClick={handleListenExample} className="gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Listen to Example
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex w-full sm:w-auto gap-3">
              <Button 
                variant="secondary" 
                onClick={handlePrevious} 
                disabled={currentIndex === 0}
                className="gap-2 flex-1 sm:flex-none"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </Button>
              <Button variant="primary" onClick={handleNext} className="gap-2 flex-1 sm:flex-none">
                {currentIndex < questions.length - 1 ? "Next Question" : "Finish"}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <p className="hidden sm:block text-xs text-ink-secondary mt-3 text-center">
            ใช้ปุ่ม ← → บนคีย์บอร์ดเพื่อเปลี่ยนประโยค และกด Space เพื่อเล่นหรือหยุดเสียง
          </p>
        </div>
      </div>
    </div>
  )
}
