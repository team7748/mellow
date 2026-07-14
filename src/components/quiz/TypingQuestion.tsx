import { useState } from "react"
import { ArrowRight, CheckCircle2, Lightbulb, SkipForward, XCircle } from "lucide-react"
import { Button } from "../ui/Button"
import { SpeakButton } from "../ui/SpeakButton"
import type { VocabularyItem } from "../../types/vocabulary"
import { playCorrectSound, playIncorrectSound } from "../../utils/audioEffects"

export function TypingQuestion({
  word,
  onAnswer,
  onSkip,
}: {
  word: VocabularyItem
  onAnswer: (isCorrect: boolean) => void
  onSkip: () => void
}) {
  const [userInput, setUserInput] = useState("")
  const [isAnswered, setIsAnswered] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const isCorrect =
    userInput.trim().toLowerCase() === word.word.toLowerCase()

  function handleSubmit() {
    if (isAnswered || !userInput.trim()) return
    setIsAnswered(true)
    
    if (isCorrect) {
      playCorrectSound()
    } else {
      playIncorrectSound()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (isAnswered) {
        onAnswer(isCorrect)
      } else {
        handleSubmit()
      }
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink-secondary">
        {word.quiz?.questionTH || "พิมพ์คำศัพท์ภาษาอังกฤษ"}
      </p>

      <div className="mt-3">
        <p className="text-sm text-ink-secondary">คำแปลภาษาไทย:</p>
        <p className="mt-1 text-2xl font-bold text-primary sm:text-3xl">
          {word.thaiMeaning}
        </p>
        {word.partOfSpeechStandard && (
          <p className="mt-1 text-sm text-ink-secondary">
            ({word.partOfSpeechStandard})
          </p>
        )}
      </div>

      {/* Hint */}
      {showHint && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Lightbulb
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-amber-800">
            ขึ้นต้นด้วย: <span className="font-bold">{word.word.charAt(0).toUpperCase()}</span>{" "}
            ({word.word.length} ตัวอักษร)
          </p>
        </div>
      )}

      {/* Input */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAnswered}
          placeholder="พิมพ์คำตอบภาษาอังกฤษ..."
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          autoFocus
          className="ui-control flex-1 px-6 py-4 text-xl sm:text-2xl font-bold text-center tracking-wide rounded-2xl focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
          aria-label="พิมพ์คำตอบ"
        />
        {!isAnswered && (
          <Button className="w-full sm:w-auto min-w-[120px] rounded-2xl shadow-md text-lg" onClick={handleSubmit} disabled={!userInput.trim()}>
            ตรวจ
          </Button>
        )}
      </div>

      {/* Buttons row */}
      {!isAnswered && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHint(true)}
            disabled={showHint}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-amber-800 transition duration-150 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
            Hint
          </button>
          <Button variant="secondary" onClick={onSkip} className="ml-auto text-sm">
            <SkipForward className="mr-1 h-4 w-4" aria-hidden="true" />
            ข้าม
          </Button>
        </div>
      )}

      {/* Feedback Card */}
      {isAnswered && (
        <div
          className={`feedback-card mt-8 animate-in slide-in-from-bottom-8 fade-in duration-500 p-6 rounded-2xl shadow-xl border-2 z-10 relative ${isCorrect ? "bg-primary-soft/80 border-primary/30" : "bg-rose-50 border-rose-200"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`flex shrink-0 h-12 w-12 items-center justify-center rounded-full ${isCorrect ? "bg-primary text-white" : "bg-rose-500 text-white"} shadow-inner`}>
                {isCorrect ? (
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <XCircle className="h-6 w-6" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col">
                <p className={`text-xl font-black tracking-tight ${isCorrect ? "text-primary-dark" : "text-rose-700"}`}>
                  {isCorrect ? "ถูกต้อง! 🎉" : "ยังไม่ถูก"}
                </p>
                <p className="mt-1 text-base text-ink-DEFAULT">
                  คำตอบที่ถูก: <span className="font-bold">{word.word}</span>
                </p>
              </div>
            </div>
            
            <Button
              className="w-full sm:w-auto min-h-12 text-base rounded-xl shadow-md"
              variant={isCorrect ? "primary" : "danger"}
              onClick={() => onAnswer(isCorrect)}
            >
              <ArrowRight className="mr-2 h-5 w-5" aria-hidden="true" />
              ข้อถัดไป (Enter)
            </Button>
          </div>
          
          {word.quiz?.hintTH && (
            <div className="mt-4 flex items-start gap-3 bg-white/60 p-4 rounded-xl ring-1 ring-black/5">
              <span className="text-xl">💡</span>
              <p className="text-sm text-ink-DEFAULT leading-relaxed">
                <span className="font-bold">คำอธิบาย:</span> {word.quiz.hintTH}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
