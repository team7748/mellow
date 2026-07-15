import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Trophy, Target, AlertCircle, XCircle, CheckCircle } from "lucide-react"
import { Button } from "../ui/Button"
import { getReviewWords, updateWordProgress } from "../../utils/vocabulary"
import { playCorrectSound, playIncorrectSound, playFlipSound } from "../../utils/audioEffects"
import { SwipeableCard } from "./SwipeableCard"
import {
  getSrsEnabled,
  getSrsRecord,
  processSrsAnswer,
} from "../../utils/srsService"
import { useGrammarProgress } from "../../hooks/useGrammarProgress"
import type { UnifiedFlashcard } from "../../types/flashcardItem"
import { recordLearningActivity } from "../../lib/activity/recordLearningActivity"
import {
  FLASHCARD_PROGRESS_SESSION_KEY,
  clearPracticeSession,
  loadPracticeSession,
  savePracticeSession,
} from "../../lib/practiceSessionStorage"

export type FlashcardSessionResult = {
  forgot: string[]
  medium: string[]
  known: string[]
  // SRS extras
  srsAgain: string[]
  srsHard: string[]
  srsGood: string[]
  srsEasy: string[]
  loopCount: number
  totalCards: number
  srsEnabled: boolean
}

type FlashcardPracticeProps = {
  cards: UnifiedFlashcard[]
  onComplete: (result: FlashcardSessionResult) => void
  onBack: () => void
}

type FlashcardProgressSnapshot = {
  cardIds: string[]
  queue: string[]
  currentIndex: number
  isFlipped: boolean
  forgotIds: string[]
  mediumIds: string[]
  knownIds: string[]
  srsAgain: string[]
  srsHard: string[]
  srsGood: string[]
  srsEasy: string[]
  loopCount: number
  cardLoopMap: Record<string, number>
  showLoopWarning: boolean
  sessionId: string
}

function wasSrsRecordDue(record: ReturnType<typeof getSrsRecord>): boolean {
  return Boolean(
    record &&
      record.status !== "new" &&
      Date.parse(record.dueDate) <= Date.now(),
  )
}

export function FlashcardPractice({
  cards,
  onComplete,
  onBack,
}: FlashcardPracticeProps) {
  const srsEnabled = useMemo(() => getSrsEnabled(), [])
  const { recordFlashcardAttempt } = useGrammarProgress()

  // Base initial cards
  const initialCards = cards
  const initialCardIds = initialCards.map((card) => card.id)
  const savedProgress = loadPracticeSession<FlashcardProgressSnapshot>(
    FLASHCARD_PROGRESS_SESSION_KEY,
  )
  const canRestoreProgress = Boolean(
    savedProgress &&
      savedProgress.cardIds.length === initialCardIds.length &&
      savedProgress.cardIds.every((id, index) => id === initialCardIds[index]),
  )
  const [sessionId] = useState(
    () =>
      savedProgress?.sessionId ??
        globalThis.crypto?.randomUUID?.() ??
        `flashcard-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )

  // Queue of card IDs (we use the unique `id` of each session card)
  const [queue, setQueue] = useState<string[]>(() =>
    canRestoreProgress ? savedProgress!.queue : initialCardIds,
  )
  const [currentIndex, setCurrentIndex] = useState(() =>
    canRestoreProgress ? savedProgress!.currentIndex : 0,
  )

  const [isFlipped, setIsFlipped] = useState(() =>
    canRestoreProgress ? savedProgress!.isFlipped : false,
  )
  const [recentAnswer, setRecentAnswer] = useState<string | null>(null)

  // Stats
  const [forgotIds, setForgotIds] = useState<string[]>(() => canRestoreProgress ? savedProgress!.forgotIds : [])
  const [mediumIds, setMediumIds] = useState<string[]>(() => canRestoreProgress ? savedProgress!.mediumIds : [])
  const [knownIds, setKnownIds] = useState<string[]>(() => canRestoreProgress ? savedProgress!.knownIds : [])
  const [srsAgain, setSrsAgain] = useState<string[]>(() => canRestoreProgress ? savedProgress!.srsAgain : [])
  const [srsHard, setSrsHard] = useState<string[]>(() => canRestoreProgress ? savedProgress!.srsHard : [])
  const [srsGood, setSrsGood] = useState<string[]>(() => canRestoreProgress ? savedProgress!.srsGood : [])
  const [srsEasy, setSrsEasy] = useState<string[]>(() => canRestoreProgress ? savedProgress!.srsEasy : [])
  const [loopCount, setLoopCount] = useState(() => canRestoreProgress ? savedProgress!.loopCount : 0)

  // Infinite loop protection
  const [cardLoopMap, setCardLoopMap] = useState<Record<string, number>>(() => canRestoreProgress ? savedProgress!.cardLoopMap : {})
  const [showLoopWarning, setShowLoopWarning] = useState(() => canRestoreProgress ? savedProgress!.showLoopWarning : false)

  const sessionProgress = queue.length > 0 ? Math.round((currentIndex / queue.length) * 100) : 0

  function buildResult(): FlashcardSessionResult {
    return {
      forgot: forgotIds,
      medium: mediumIds,
      known: knownIds,
      srsAgain,
      srsHard,
      srsGood,
      srsEasy,
      loopCount,
      totalCards: initialCards.length,
      srsEnabled,
    }
  }

  function handleRequeue(cardId: string) {
    setLoopCount(prev => prev + 1)
    let willShowWarning = false
    setCardLoopMap(prev => {
      const count = (prev[cardId] || 0) + 1
      if (count >= 5) {
        willShowWarning = true
        setShowLoopWarning(true)
      }
      return { ...prev, [cardId]: count }
    })

    // Requeue after 3-5 cards, or at the end if fewer
    setQueue(prevQueue => {
      const remaining = prevQueue.length - 1 - currentIndex
      const insertOffset = Math.min(remaining, Math.floor(Math.random() * 3) + 3)
      const newQueue = [...prevQueue]
      newQueue.splice(currentIndex + 1 + insertOffset, 0, cardId)
      return newQueue
    })

    return willShowWarning
  }

  const cardMap = useMemo(() => new Map(initialCards.map(c => [c.id, c])), [initialCards])

  function answerNormal(difficulty: "forgot" | "medium" | "known") {
    if (currentIndex >= queue.length) return
    const cardId = queue[currentIndex]
    const card = cardMap.get(cardId)
    if (!card) return

    let didRequeue = false
    let willShowWarning = false

    if (difficulty === "known") {
      playCorrectSound()
      setKnownIds(prev => [...prev, cardId])
    } else if (difficulty === "forgot") {
      playIncorrectSound()
      setForgotIds(prev => [...prev, cardId])
      willShowWarning = handleRequeue(cardId)
      didRequeue = true
    } else if (difficulty === "medium") {
      playFlipSound()
      setMediumIds(prev => [...prev, cardId])
    }

    if (card.type === "vocabulary" && card.wordId) {
      const wasDue = getReviewWords().some((word) => word.id === card.wordId)
      updateWordProgress(card.wordId, difficulty)
      recordLearningActivity({
        kind: "vocabulary_answer",
        mode: "flashcard",
        entityId: card.wordId,
        metadata: {
          correct: difficulty !== "forgot",
          wasDue,
          sessionId,
        },
      })
    } else if (card.type !== "vocabulary" && card.topicId && card.patternId) {
      const isCorrect = difficulty === "known"
      recordFlashcardAttempt(card.topicId, card.patternId, isCorrect)
    }

    advance(difficulty, didRequeue, willShowWarning)
  }

  function answerSrs(difficulty: "again" | "hard" | "good" | "easy") {
    if (currentIndex >= queue.length) return
    const cardId = queue[currentIndex]
    const card = cardMap.get(cardId)
    if (!card) return

    let didRequeue = false
    let willShowWarning = false

    if (difficulty === "easy" || difficulty === "good") {
      playCorrectSound()
    } else if (difficulty === "again") {
      playIncorrectSound()
      willShowWarning = handleRequeue(cardId)
      didRequeue = true
    } else {
      playFlipSound()
    }

    if (difficulty === "again") setSrsAgain(prev => [...prev, cardId])
    if (difficulty === "hard") setSrsHard(prev => [...prev, cardId])
    if (difficulty === "good") setSrsGood(prev => [...prev, cardId])
    if (difficulty === "easy") setSrsEasy(prev => [...prev, cardId])

    if (card.type === "vocabulary" && card.wordId) {
      const previousSrsRecord = getSrsRecord(card.wordId)
      const wasDue = wasSrsRecordDue(previousSrsRecord)
      processSrsAnswer(card.wordId, difficulty)
      recordLearningActivity({
        kind: "vocabulary_answer",
        mode: "flashcard",
        entityId: card.wordId,
        metadata: {
          correct: difficulty !== "again",
          wasDue,
          sessionId,
        },
      })
    } else if (card.type !== "vocabulary" && card.topicId && card.patternId) {
      processSrsAnswer(card.patternId, difficulty)
      const isCorrect = difficulty === "easy" || difficulty === "good"
      recordFlashcardAttempt(card.topicId, card.patternId, isCorrect)
    }

    advance(difficulty, didRequeue, willShowWarning)
  }

  useEffect(() => {
    if (currentIndex >= queue.length && queue.length > 0 && !showLoopWarning) {
      clearPracticeSession(FLASHCARD_PROGRESS_SESSION_KEY)
      const timer = setTimeout(() => onComplete(buildResult()), 300)
      return () => clearTimeout(timer)
    }
  })

  useEffect(() => {
    if (initialCards.length === 0 || currentIndex >= queue.length) return
    savePracticeSession<FlashcardProgressSnapshot>(FLASHCARD_PROGRESS_SESSION_KEY, {
      cardIds: initialCardIds,
      queue,
      currentIndex,
      isFlipped,
      forgotIds,
      mediumIds,
      knownIds,
      srsAgain,
      srsHard,
      srsGood,
      srsEasy,
      loopCount,
      cardLoopMap,
      showLoopWarning,
      sessionId,
    })
  }, [
    initialCards.length,
    initialCardIds,
    queue,
    currentIndex,
    isFlipped,
    forgotIds,
    mediumIds,
    knownIds,
    srsAgain,
    srsHard,
    srsGood,
    srsEasy,
    loopCount,
    cardLoopMap,
    showLoopWarning,
    sessionId,
  ])

  function advance(answerLabel: string, didRequeue: boolean, willShowWarning: boolean) {
    setRecentAnswer(answerLabel)
    if (!willShowWarning) {
      setCurrentIndex((i) => i + 1)
      setIsFlipped(false)
    }
  }

  function handleFlip() { setIsFlipped((prev) => !prev) }

  function handleSwipe(direction: "left" | "right") {
    if (srsEnabled) {
      if (direction === "right") answerSrs("good")
      else answerSrs("again")
    } else {
      if (direction === "right") answerNormal("known")
      else answerNormal("forgot")
    }
  }

  function goPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setIsFlipped(false)
      setShowLoopWarning(false)
    }
  }

  function goNext() {
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((i) => i + 1)
      setIsFlipped(false)
      setShowLoopWarning(false)
    } else {
      onComplete(buildResult())
    }
  }

  useEffect(() => {
    if (!recentAnswer) return
    const timeoutId = window.setTimeout(() => setRecentAnswer(null), 900)
    return () => window.clearTimeout(timeoutId)
  }, [recentAnswer])

  useEffect(() => {
    if (queue.length === 0 || showLoopWarning) return

    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return

      if (e.code === "Space") {
        e.preventDefault()
        if (!isFlipped) playFlipSound()
        setIsFlipped((prev) => !prev)
      } else if (e.code === "ArrowLeft" && !isFlipped) {
        e.preventDefault()
        goPrevious()
      } else if (e.code === "ArrowRight" && !isFlipped) {
        e.preventDefault()
        goNext()
      } else if (e.code === "Digit1" && isFlipped) {
        e.preventDefault()
        if (srsEnabled) answerSrs("again")
        else answerNormal("forgot")
      } else if (e.code === "Digit2" && isFlipped) {
        e.preventDefault()
        if (srsEnabled) answerSrs("hard")
        else answerNormal("medium")
      } else if (e.code === "Digit3" && isFlipped) {
        e.preventDefault()
        if (srsEnabled) answerSrs("good")
        else answerNormal("known")
      } else if (e.code === "Digit4" && isFlipped && srsEnabled) {
        e.preventDefault()
        answerSrs("easy")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  if (initialCards.length === 0) {
    return (
      <div className="empty-state mx-auto max-w-2xl text-center py-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
        <p className="text-sm font-semibold text-primary">Flashcard Practice</p>
        <h2 className="mt-2 text-2xl font-bold text-ink-DEFAULT">ไม่มีการ์ดให้ฝึก</h2>
        <Button className="mt-6 mx-auto" onClick={onBack}>
          กลับเลือกชุดการ์ด
        </Button>
      </div>
    )
  }

  if (showLoopWarning) {
    return (
      <div className="mx-auto max-w-2xl text-center py-12">
        <div className="surface-section border-amber-200 bg-amber-50">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-600 mb-4" />
          <h2 className="text-xl font-bold text-ink-DEFAULT">การ์ดนี้ยังยากอยู่ใช่มั้ย?</h2>
          <p className="mt-2 text-sm text-ink-secondary mb-6">
            คุณตอบผิดการ์ดนี้หลายครั้งแล้ว ลองอ่านคำอธิบายเพิ่มเติม แล้วค่อยทบทวนอีกครั้งไหมครับ?
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button onClick={() => {
              setShowLoopWarning(false)
              setIsFlipped(true)
            }} variant="secondary">
              ดูเฉลยและคำอธิบาย
            </Button>
            <Button onClick={() => {
              setShowLoopWarning(false)
              if (currentIndex + 1 >= queue.length) {
                onComplete(buildResult())
              } else {
                setCurrentIndex(i => i + 1)
                setIsFlipped(false)
              }
            }} className="bg-amber-600 hover:bg-amber-700 text-white border-transparent">
              ข้ามไว้ทบทวนภายหลัง
            </Button>
            <Button onClick={() => onComplete(buildResult())} variant="secondary">
              จบ Session ตอนนี้
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const visibleCards = queue.slice(currentIndex, currentIndex + 3).map(id => cardMap.get(id)).filter((c): c is UnifiedFlashcard => c !== undefined)

  const feedbackLabels: Record<string, string> = {
    forgot: "บันทึกแล้ว: จำไม่ได้",
    medium: "บันทึกแล้ว: พอจำได้",
    known: "บันทึกแล้ว: จำได้แล้ว",
    again: "ทบทวนอีกครั้ง",
    hard: "บันทึกแล้ว: ยาก",
    good: "บันทึกแล้ว: พอจำได้",
    easy: "บันทึกแล้ว: ง่าย",
  }

  return (
    <>
      <section className="surface-section mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Target className="h-5 w-5" aria-hidden="true" />
              Flashcard Practice {srsEnabled && <span className="ui-badge ui-badge-accent ml-2 text-[10px]">SRS ON</span>}
            </div>
            <p className="mt-1 text-sm text-ink-secondary">
              รวมทั้งหมด {initialCards.length.toLocaleString()} การ์ดในชุดนี้
            </p>
          </div>

          <div className="w-full rounded-lg border border-border bg-slate-50/80 p-4 lg:max-w-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-ink-DEFAULT">
                  {currentIndex + 1} / {queue.length}
                </p>
                <p className="text-xs font-medium text-ink-secondary">
                  ความคืบหน้า
                </p>
              </div>
              <p className="rounded-full bg-card px-3 py-1 text-sm font-semibold text-primary ring-1 ring-primary/20">
                {sessionProgress}%
              </p>
            </div>
              <div
                aria-label={`Flashcard session progress ${sessionProgress}%`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={sessionProgress}
                className="mt-4 h-2 overflow-hidden rounded-full bg-card ring-1 ring-border"
                role="progressbar"
              >
              <div
                className="h-full rounded-full bg-primary transition-[width,background-color] duration-[220ms,160ms] ease-out"
                style={{ width: `${sessionProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onBack} className="text-sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> กลับ
          </Button>
          <Button variant="secondary" onClick={() => onComplete(buildResult())} className="text-sm">
            จบการฝึก
          </Button>
        </div>
      </section>

      <div
        className={`text-center font-bold mb-4 min-h-[1.75rem] transition-all duration-300 transform ${
          recentAnswer ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        } ${recentAnswer === "forgot" ? "text-rose-600" : recentAnswer === "medium" ? "text-amber-600" : recentAnswer === "known" ? "text-emerald-500" : "text-primary"}`}
      >
        {recentAnswer ? feedbackLabels[recentAnswer] : ""}
      </div>

      <div className="relative mx-auto w-full max-w-3xl perspective-[1000px] mb-8">
        <div className="grid place-items-center w-full">
          {visibleCards.map((card, i) => (
            <SwipeableCard
              key={`${card.id}-${currentIndex + i}`}
              card={card}
              index={i}
              isFlipped={i === 0 ? isFlipped : false}
              onFlip={i === 0 ? handleFlip : () => {}}
              onSwipe={i === 0 ? handleSwipe : () => {}}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="secondary" onClick={goPrevious} disabled={currentIndex === 0}
            className="order-2 w-full sm:order-1 sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-5 w-5 sm:mr-0" />
            <span className="sm:hidden">ก่อนหน้า</span>
          </Button>

          <div className="order-1 flex w-full flex-1 flex-col justify-center gap-2 sm:order-2 sm:flex-row sm:gap-3">
            {!isFlipped ? (
              <Button
                className="w-full sm:max-w-[200px] mx-auto py-3 sm:py-2" variant="secondary"
                onClick={() => { playFlipSound(); handleFlip() }}
              >
                พลิกการ์ด (Spacebar)
              </Button>
            ) : srsEnabled ? (
              <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-1 sm:gap-3">
                <Button variant="outline-danger" className="w-full sm:flex-1 py-3 sm:py-2 active:scale-[0.98]" onClick={() => answerSrs("again")}>
                  จำไม่ได้
                </Button>
                <Button variant="outline-warning" className="w-full sm:flex-1 py-3 sm:py-2 active:scale-[0.98]" onClick={() => answerSrs("hard")}>
                  ยาก
                </Button>
                <Button variant="outline-success" className="w-full sm:flex-1 py-3 sm:py-2 active:scale-[0.98]" onClick={() => answerSrs("good")}>
                  พอจำได้
                </Button>
                <Button variant="outline-info" className="w-full sm:flex-1 py-3 sm:py-2 active:scale-[0.98]" onClick={() => answerSrs("easy")}>
                  ง่าย
                </Button>
              </div>
            ) : (
              <div className="flex flex-row w-full gap-2 sm:flex-1 sm:gap-3">
                <Button aria-label="ปัดซ้าย: ยังจำไม่ได้" variant="outline-danger" className="flex-1 py-3 sm:py-2 text-base active:scale-[0.98]" onClick={() => answerNormal("forgot")}>
                  <XCircle className="w-5 h-5 mr-2" /> ลืม
                </Button>
                <Button aria-label="ปัดขวา: จำได้แล้ว" variant="outline-success" className="flex-1 py-3 sm:py-2 text-base active:scale-[0.98]" onClick={() => answerNormal("known")}>
                  <CheckCircle className="w-5 h-5 mr-2" /> จำได้
                </Button>
              </div>
            )}
          </div>

          <Button variant="secondary" onClick={goNext} className="order-3 w-full sm:w-auto">
            <span className="sm:hidden">ข้าม</span>
            <ArrowRight className="ml-2 h-5 w-5 sm:ml-0" />
          </Button>
        </div>
      </div>
    </>
  )
}
