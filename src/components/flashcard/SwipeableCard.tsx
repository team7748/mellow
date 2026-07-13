import { useRef, useState } from "react"
import { Eye, CheckCircle, XCircle } from "lucide-react"
import { SpeakButton } from "../ui/SpeakButton"
import { playFlipSound } from "../../utils/audioEffects"
import type { UnifiedFlashcard } from "../../types/flashcardItem"

function hasText(value?: string | null) {
  return Boolean(value && value.trim().length > 0)
}

type SwipeableCardProps = {
  card: UnifiedFlashcard
  index: number
  isFlipped: boolean
  onFlip: () => void
  onSwipe: (direction: "left" | "right") => void
}

export function SwipeableCard({
  card,
  index,
  isFlipped,
  onFlip,
  onSwipe,
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [flyOut, setFlyOut] = useState<"left" | "right" | null>(null)
  
  const dragStartPos = useRef({ x: 0, y: 0 })
  const isPointerDown = useRef(false)

  const swipeThreshold = 100 // pixels
  const rotationMultiplier = 0.05

  function handlePointerDown(e: React.PointerEvent) {
    if (index !== 0 || flyOut) return
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("[role='button']")) {
      return
    }

    isPointerDown.current = true
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    setIsDragging(false)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isPointerDown.current || index !== 0 || flyOut) return

    const dx = e.clientX - dragStartPos.current.x
    const dy = e.clientY - dragStartPos.current.y

    if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      setIsDragging(true)
    }

    if (isDragging) {
      setDragOffset({ x: dx, y: dy })
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isPointerDown.current || index !== 0 || flyOut) return
    isPointerDown.current = false
    
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

    if (!isDragging) {
      if (!isFlipped) playFlipSound()
      onFlip()
      return
    }

    setIsDragging(false)

    if (dragOffset.x > swipeThreshold) {
      setFlyOut("right")
      setTimeout(() => onSwipe("right"), 300)
    } else if (dragOffset.x < -swipeThreshold) {
      setFlyOut("left")
      setTimeout(() => onSwipe("left"), 300)
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
  }

  let transform = ""
  let transition = ""
  let opacity = 1
  const zIndex = 10 - index
  const pointerEvents = index === 0 ? "auto" : "none"

  if (flyOut === "right") {
    transform = `translate3d(${window.innerWidth}px, ${dragOffset.y}px, 0) rotate(15deg)`
    transition = "transform 300ms ease-out, opacity 300ms ease-out"
    opacity = 0
  } else if (flyOut === "left") {
    transform = `translate3d(-${window.innerWidth}px, ${dragOffset.y}px, 0) rotate(-15deg)`
    transition = "transform 300ms ease-out, opacity 300ms ease-out"
    opacity = 0
  } else if (index === 0) {
    const rotate = dragOffset.x * rotationMultiplier
    transform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotate}deg)`
    transition = isDragging ? "none" : "transform 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  } else {
    const scale = 1 - index * 0.05
    const yOffset = index * 12
    transform = `translate3d(0, ${yOffset}px, 0) scale(${scale})`
    if (index === 1 && isDragging) {
      const progress = Math.min(Math.abs(dragOffset.x) / swipeThreshold, 1)
      const dynamicScale = scale + progress * 0.05
      const dynamicY = yOffset - progress * 12
      transform = `translate3d(0, ${dynamicY}px, 0) scale(${dynamicScale})`
    }
    transition = isDragging ? "none" : "transform 200ms ease-out"
    opacity = index === 1 ? 0.9 : 0.5
  }

  const rightLabelOpacity = index === 0 && dragOffset.x > 0 ? Math.min(dragOffset.x / (swipeThreshold * 0.8), 1) : 0
  const leftLabelOpacity = index === 0 && dragOffset.x < 0 ? Math.min(Math.abs(dragOffset.x) / (swipeThreshold * 0.8), 1) : 0

  return (
    <article
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform,
        transition,
        opacity,
        zIndex,
        pointerEvents: pointerEvents as "auto" | "none",
        touchAction: "none",
        gridArea: "1 / 1",
      }}
      className={`surface-card w-full max-w-3xl p-5 text-center sm:p-8 flex flex-col min-h-[350px] sm:min-h-[400px] select-none`}
      aria-label={`การ์ดคำศัพท์: ${card.front}`}
    >
      {/* Swipe Labels */}
      {index === 0 && (
        <>
          <div
            className="absolute top-8 left-8 border-4 border-primary text-primary font-bold text-2xl sm:text-3xl uppercase tracking-widest px-4 py-2 rounded-lg transform -rotate-12 pointer-events-none bg-card/50 backdrop-blur-sm"
            style={{ opacity: rightLabelOpacity }}
          >
            จำได้
          </div>
          <div
            className="absolute top-8 right-8 border-4 border-rose-500 text-rose-500 font-bold text-2xl sm:text-3xl uppercase tracking-widest px-4 py-2 rounded-lg transform rotate-12 pointer-events-none bg-card/50 backdrop-blur-sm"
            style={{ opacity: leftLabelOpacity }}
          >
            ลืม
          </div>
        </>
      )}

      {/* Card meta badges */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-ink-secondary">
          <span className={`rounded-md px-2 py-1 uppercase text-white ${card.type === 'vocabulary' ? 'bg-blue-500' : 'bg-purple-500'}`}>
            {card.type === 'common_mistake' ? 'mistake' : card.type === 'fill_blank' ? 'fill in blank' : card.type === 'correct_or_incorrect' ? 'correct / incorrect' : card.type}
          </span>
          {card.cefr && <span className="rounded-md bg-slate-100/80 px-2 py-1 text-ink-secondary">{card.cefr}</span>}
          {card.partOfSpeech && <span className="rounded-md bg-slate-100/80 px-2 py-1 text-ink-secondary">{card.partOfSpeech}</span>}
          {card.category && card.category.length > 0 && <span className="rounded-md bg-slate-100/80 px-2 py-1 text-ink-secondary truncate max-w-[150px]">{card.category[0]}</span>}
        </div>
        <span className="ui-badge ui-badge-accent shrink-0">
          {isFlipped ? "ด้านหลัง" : "ด้านหน้า"}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {/* Front of card */}
        {!isFlipped && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-snug text-ink-DEFAULT text-center max-w-full break-words">
                {card.type === "fill_blank" ? card.front.replace("___", "________") : card.front}
              </h2>
              {card.type === "vocabulary" && (
                <SpeakButton
                  className="min-h-12 min-w-12 bg-primary-soft text-primary ring-1 ring-primary/20 hover:bg-primary-active shrink-0"
                  label={`ฟังเสียง ${card.front}`}
                  text={card.front}
                />
              )}
            </div>
            
            {card.options && card.options.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-3 w-full">
                {card.options.map((opt, i) => (
                  <div key={i} className="px-4 py-2 border-2 border-border rounded-lg text-ink-secondary font-medium">
                    {opt}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-8 text-sm text-ink-secondary">
              (ลากเพื่อข้าม หรือแตะเพื่อดูเฉลย)
            </p>
          </div>
        )}

        {/* Back of card */}
        {isFlipped && (
          <div className="mt-7 space-y-4 rounded-xl border border-primary/20 bg-primary-soft p-5 text-left animate-in fade-in zoom-in-95 duration-200">
            {/* Vocabulary Style */}
            {card.type === "vocabulary" && (
              <>
                <div>
                  <p className="text-xs font-semibold text-primary tracking-wide uppercase">ความหมาย</p>
                  <p className="mt-1 text-xl font-semibold text-ink-DEFAULT">{card.back}</p>
                </div>
                {hasText(card.note) && (
                  <div className="rounded-lg bg-card/80 p-4 ring-1 ring-primary/20 shadow-sm mt-4">
                    <p className="text-xs font-semibold text-primary tracking-wide uppercase">ตัวอย่างประโยค</p>
                    <p className="mt-2 text-base font-semibold text-ink-DEFAULT">{card.note}</p>
                  </div>
                )}
              </>
            )}

            {/* Grammar Styles */}
            {card.type !== "vocabulary" && (
              <>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-primary tracking-wide uppercase">
                    {card.type === 'rule' || card.type === 'compare' ? 'ข้อมูล / ความหมาย' : 'เฉลย'}
                  </p>
                  
                  {card.type === 'correct_or_incorrect' && card.back.toLowerCase() === 'correct' ? (
                    <div className="flex items-center gap-2 text-primary font-bold text-2xl">
                      <CheckCircle className="w-6 h-6" /> ถูกต้อง
                    </div>
                  ) : card.type === 'correct_or_incorrect' && card.back.toLowerCase() === 'incorrect' ? (
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-2xl">
                      <XCircle className="w-6 h-6" /> ไม่ถูกต้อง
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-primary leading-snug">{card.back}</p>
                  )}
                </div>

                {hasText(card.note) && (
                  <div className="rounded-lg bg-card p-4 ring-1 ring-border mt-4">
                    <p className="text-sm font-semibold text-ink-secondary mb-2">คำอธิบายเพิ่มเติม</p>
                    <p className="text-base font-medium text-ink-DEFAULT leading-relaxed whitespace-pre-wrap">{card.note}</p>
                  </div>
                )}
                
                {hasText(card.example) && (
                  <div className="rounded-lg bg-primary-soft p-4 ring-1 ring-primary/20 mt-4">
                    <p className="text-sm font-semibold text-primary mb-2">ตัวอย่าง</p>
                    <p className="text-base font-medium text-ink-dark leading-relaxed">{card.example}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
