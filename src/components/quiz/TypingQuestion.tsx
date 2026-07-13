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
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAnswered}
          placeholder="พิมพ์คำศัพท์ภาษาอังกฤษ..."
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          autoFocus
          className="ui-control flex-1 px-4 py-3 text-base font-semibold"
          aria-label="พิมพ์คำศัพท์"
        />
        {!isAnswered && (
          <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={!userInput.trim()}>
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

      {/* Feedback */}
      {isAnswered && (
        <div
          className="feedback-card mt-4 animate-in slide-in-from-bottom-2 fade-in duration-300"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
            )}
            <p className="font-semibold text-ink-DEFAULT">
              {isCorrect ? "ถูกต้อง! 🎉" : "ยังไม่ถูก"}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm text-ink-DEFAULT">
              คำตอบที่ถูก:{" "}
              <span className="font-bold text-primary">{word.word}</span>
            </p>
            <SpeakButton
              text={word.word}
              label={`ฟังเสียง ${word.word}`}
              className="bg-primary-soft text-primary ring-1 ring-primary/20 hover:bg-primary-active"
            />
          </div>
          {word.example && (
            <p className="mt-1 text-sm text-ink-secondary">
              ตัวอย่าง: {word.example}
            </p>
          )}
          <Button
            className="mt-3 w-full sm:w-auto"
            onClick={() => onAnswer(isCorrect)}
          >
            <ArrowRight className="mr-2 h-4 w-4" aria-hidden="true" />
            ข้อถัดไป
          </Button>
        </div>
      )}
    </div>
  )
}
