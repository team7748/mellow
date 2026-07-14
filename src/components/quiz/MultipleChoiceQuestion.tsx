import { useEffect, useMemo, useState } from "react"
import { ArrowRight, CheckCircle2, SkipForward, XCircle } from "lucide-react"
import { Button } from "../ui/Button"
import { SpeakButton } from "../ui/SpeakButton"
import type { VocabularyItem } from "../../types/vocabulary"
import { playCorrectSound, playIncorrectSound } from "../../utils/audioEffects"

// ─── Helpers ───────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Generate 4 multiple-choice options for a given word.
 * Distractors come from allWords (entire vocabulary).
 * Improved distractor selection: prefers words from different categories to reduce confusing similarity,
 * or at least ensures they don't share large substrings if from the same category.
 */
function buildMultipleChoiceOptions(
  word: VocabularyItem,
  allWords: VocabularyItem[],
): string[] {
  const correctAnswer = (word.quiz?.answerTH || word.thaiMeaning).trim()
  
  // Basic valid distractors: not same id, not same exact meaning, not empty
  let distractors = allWords.filter((w) => {
    const meaning = (w.quiz?.answerTH || w.thaiMeaning).trim()
    return (
      w.id !== word.id &&
      meaning !== correctAnswer &&
      meaning !== ""
    )
  })

  // Filter out distractors that are too similar (e.g., "งาน" vs "ทำงาน")
  // We do a simple check: if one string contains the other and length diff is small, skip it.
  distractors = distractors.filter((w) => {
    const d = w.thaiMeaning.trim()
    const isSubstring = d.includes(correctAnswer) || correctAnswer.includes(d)
    const isTooSimilar = isSubstring && Math.abs(d.length - correctAnswer.length) <= 4
    return !isTooSimilar
  })

  // Map to string meanings and get unique
  const uniqueDistractors = Array.from(new Set(distractors.map((w) => (w.quiz?.answerTH || w.thaiMeaning).trim())))
  const shuffled = shuffleArray(uniqueDistractors).slice(0, 3)

  return shuffleArray([correctAnswer, ...shuffled])
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function MultipleChoiceQuestion({
  word,
  allWords,
  onAnswer,
  onSkip,
}: {
  word: VocabularyItem
  allWords: VocabularyItem[]
  onAnswer: (isCorrect: boolean) => void
  onSkip: () => void
}) {
  const options = useMemo(
    () => buildMultipleChoiceOptions(word, allWords),
    [word, allWords],
  )
  const [selected, setSelected] = useState<string | null>(null)
  const isAnswered = selected !== null
  const correctAnswer = (word.quiz?.answerTH || word.thaiMeaning).trim()

  function handleSelect(option: string) {
    if (isAnswered) return
    setSelected(option)
    
    if (option === correctAnswer) {
      playCorrectSound()
    } else {
      playIncorrectSound()
    }
  }

  // Keyboard support for 1, 2, 3, 4, Enter
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isAnswered) {
        if (e.key >= "1" && e.key <= "4") {
          const index = parseInt(e.key, 10) - 1
          if (options[index]) {
            handleSelect(options[index])
          }
        }
      } else {
        if (e.key === "Enter") {
          e.preventDefault()
          onAnswer(selected === correctAnswer)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isAnswered, options, selected, onAnswer, word])

  return (
    <div>
      <p className="text-sm font-semibold text-ink-secondary">
        {word.quiz?.questionTH || "เลือกคำแปลที่ถูกต้อง (กดปุ่ม 1-4 เพื่อตอบได้)"}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <h2 className="text-3xl font-bold text-ink-DEFAULT sm:text-4xl">
          {word.word}
        </h2>
        <SpeakButton
          text={word.word}
          label={`ฟังเสียง ${word.word}`}
          className="min-h-10 min-w-10 bg-primary-soft text-primary ring-1 ring-primary/20 hover:bg-primary-active"
        />
      </div>
      {word.partOfSpeechStandard && (
        <p className="mt-1 text-sm text-ink-secondary">
          ({word.partOfSpeechStandard})
        </p>
      )}

      <div
        className="mt-6 grid gap-3 sm:grid-cols-2"
        role="group"
        aria-label="ตัวเลือกคำตอบ"
      >
        {options.map((option, index) => {
          const isCorrectOption =
            isAnswered && option === correctAnswer
          const isSelectedWrong =
            isAnswered && option === selected && option !== correctAnswer

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={isAnswered}
              className={`group flex min-h-16 items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-base font-bold transition-all duration-300 active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                disabled:cursor-default
                ${
                  isCorrectOption
                    ? "border-primary bg-primary-soft text-ink-dark shadow-md shadow-primary/10 -translate-y-0.5"
                    : isSelectedWrong
                      ? "border-rose-400 bg-rose-50 text-rose-800 shadow-sm animate-[shake_0.4s_ease-in-out]"
                      : isAnswered
                        ? "border-border/50 bg-slate-50/50 text-ink-secondary/70"
                        : "border-border bg-card text-ink-DEFAULT hover:border-primary/60 hover:bg-primary-soft/30 hover:shadow-md hover:-translate-y-0.5"
                }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                isCorrectOption ? "bg-primary text-white" : isSelectedWrong ? "bg-rose-500 text-white" : isAnswered ? "bg-slate-200 text-ink-secondary" : "bg-slate-100 text-ink-secondary group-hover:bg-primary/20 group-hover:text-primary"
              }`}>
                {index + 1}
              </span>
              <span className="flex-1 text-lg">{option}</span>
            </button>
          )
        })}
      </div>

      {isAnswered && (
        <div
          className={`feedback-card mt-8 animate-in slide-in-from-bottom-8 fade-in duration-500 p-6 rounded-2xl shadow-xl border-2 z-10 relative ${selected === correctAnswer ? "bg-primary-soft/80 border-primary/30" : "bg-rose-50 border-rose-200"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`flex shrink-0 h-12 w-12 items-center justify-center rounded-full ${selected === correctAnswer ? "bg-primary text-white" : "bg-rose-500 text-white"} shadow-inner`}>
                {selected === correctAnswer ? (
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <XCircle className="h-6 w-6" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col">
                <p className={`text-xl font-black tracking-tight ${selected === correctAnswer ? "text-primary-dark" : "text-rose-700"}`}>
                  {selected === correctAnswer ? "ถูกต้อง! 🎉" : "ยังไม่ถูก"}
                </p>
                <p className="mt-1 text-base text-ink-DEFAULT">
                  คำตอบที่ถูก: <span className="font-bold">{correctAnswer}</span>
                </p>
              </div>
            </div>
            
            <Button
              className="w-full sm:w-auto min-h-12 text-base rounded-xl shadow-md"
              variant={selected === correctAnswer ? "primary" : "danger"}
              onClick={() => onAnswer(selected === correctAnswer)}
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

      {!isAnswered && (
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onSkip} className="text-sm">
            <SkipForward className="mr-1 h-4 w-4" aria-hidden="true" />
            ข้าม
          </Button>
        </div>
      )}
    </div>
  )
}
