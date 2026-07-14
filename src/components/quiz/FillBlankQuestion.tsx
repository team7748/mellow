import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, CheckCircle2, Lightbulb, SkipForward, XCircle } from "lucide-react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import type { VocabularyItem } from "../../types/vocabulary"
import { playCorrectSound, playIncorrectSound } from "../../utils/audioEffects"

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Build fill-in-the-blank question from example sentence.
 * Returns null if the word doesn't appear in the example.
 */
function buildFillBlank(word: VocabularyItem): {
  sentence: string
  answer: string
} | null {
  if (!word.example || !word.example.trim()) return null

  // Try case-insensitive and global match of the word in the example
  // We relax the boundary slightly for suffixes. e.g., \bword[s|ed|ing]?\b
  // To keep it simple but effective for MVP: matching the exact word, allowing up to 3 a-z characters after it.
  const regex = new RegExp(`\\b${escapeRegex(word.word)}[a-z]{0,3}\\b`, "gi")
  
  if (!regex.test(word.example)) return null

  // Replace all occurrences with a stylized placeholder
  const sentence = word.example.replace(regex, "___BLANK___")
  return { sentence, answer: word.word }
}

export function FillBlankQuestion({
  word,
  onAnswer,
  onSkip,
}: {
  word: VocabularyItem
  onAnswer: (isCorrect: boolean) => void
  onSkip: () => void
}) {
  const fillData = useMemo(() => buildFillBlank(word), [word])
  const [userInput, setUserInput] = useState("")
  const [isAnswered, setIsAnswered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showHint, setShowHint] = useState(false)

  // Fallback: if no fill-blank data, use typing mode
  const isFallbackTyping = fillData === null

  const correctAnswer = isFallbackTyping
    ? word.word
    : fillData.answer

  const isCorrect =
    userInput.trim().toLowerCase() === correctAnswer.toLowerCase()

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

  const hintText = `${word.word.charAt(0).toUpperCase()}... (${word.partOfSpeechStandard ?? "word"}) — ${word.thaiMeaning}`

  return (
    <div>
      <p className="text-sm font-semibold text-ink-secondary">
        {isFallbackTyping
          ? "พิมพ์คำศัพท์ภาษาอังกฤษ"
          : "เติมคำในช่องว่าง"}
      </p>

      {isFallbackTyping ? (
        <div className="mt-3">
          <p className="text-lg font-semibold text-ink-DEFAULT">
            คำแปล:{" "}
            <span className="text-2xl font-bold text-primary">
              {word.thaiMeaning}
            </span>
          </p>
        </div>
      ) : (
        <div className="mt-3 bg-slate-50/50 p-6 rounded-2xl border border-border/60 shadow-inner">
          <p className="text-xl font-medium leading-relaxed text-ink-DEFAULT sm:text-2xl text-center">
            {fillData.sentence.split("___BLANK___").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="inline-block mx-2 px-6 py-1 border-b-2 border-primary/40 bg-primary-soft/30 rounded-t-lg text-transparent select-none min-w-[80px]">
                    _
                  </span>
                )}
              </span>
            ))}
          </p>
          {word.exampleThai && (
            <p className="mt-4 text-sm font-medium text-ink-secondary text-center">{word.exampleThai}</p>
          )}
        </div>
      )}

      {/* Hint */}
      {showHint && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Lightbulb
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-amber-800">{hintText}</p>
        </div>
      )}

      {/* Input */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAnswered}
          placeholder="พิมพ์คำตอบที่นี่..."
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          className="flex-1 px-6 py-4 text-xl sm:text-2xl font-bold text-center tracking-wide rounded-2xl focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
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
                  คำตอบที่ถูก: <span className="font-bold">{correctAnswer}</span>
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
