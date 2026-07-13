import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import type { ConversationLine } from "../../types/conversation"
import { ConversationLineCard } from "./ConversationLineCard"
import { Button } from "../ui/Button"
import { speakText, toggleSpeech } from "../../utils/speech"

type Props = {
  title: string
  lines: ConversationLine[]
  onComplete?: () => void
}

export function ConversationPlayer({ title, lines, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showThai, setShowThai] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [speed] = useState<number>(() => {
    const saved = localStorage.getItem("speakModeSpeed")
    return saved ? Number(saved) : 0.8
  })

  const lastPlayedIndexRef = useRef<number>(-1)

  // Reset state when conversation changes
  useEffect(() => {
    setCurrentIndex(0)
    lastPlayedIndexRef.current = -1
  }, [title])

  // Auto-play audio on line change with different pitch for speakers
  useEffect(() => {
    if (lastPlayedIndexRef.current !== currentIndex && lines[currentIndex]) {
      lastPlayedIndexRef.current = currentIndex
      const line = lines[currentIndex]
      const isSpeakerA = line.speaker.toUpperCase().includes('A') || line.speaker.trim() === 'Speaker 1'
      const currentPitch = isSpeakerA ? 1 : 0.7 // Noticeably lower pitch for Speaker B
      
      try {
        speakText(line.english, { rate: speed, pitch: currentPitch })
      } catch (error) {
        // Ignore autoplay errors if browser blocks it
      }
    }
  }, [currentIndex, lines, speed])

  // Auto-scroll to active line
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentIndex])

  const handleNext = () => {
    if (currentIndex < lines.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      if (onComplete) onComplete()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in input fields
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
        handlePrev()
      } else if (e.code === "Space") {
        e.preventDefault()
        const line = lines[currentIndex]
        const isSpeakerA = line.speaker.toUpperCase().includes('A') || line.speaker.trim() === 'Speaker 1'
        const currentPitch = isSpeakerA ? 1 : 0.7
        toggleSpeech(line.english, { rate: speed, pitch: currentPitch })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, lines.length])

  const progressPct = ((currentIndex + 1) / lines.length) * 100

  return (
    <div className="surface-card flex flex-col h-full max-h-[800px]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-DEFAULT">{title}</h2>
          <p className="text-sm text-ink-secondary mt-1">ประโยคที่ {currentIndex + 1} / {lines.length}</p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowThai(!showThai)
            }}
            className={`min-h-[40px] px-3 py-2 ${showThai ? "bg-slate-100" : ""}`}
          >
            {showThai ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showThai ? "ซ่อนคำแปล" : "แสดงคำแปล"}
          </Button>
          <Button variant="secondary" onClick={handleRestart} title="เริ่มใหม่" className="min-h-[40px] px-3 py-2">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-slate-100">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Scrollable Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30"
      >
        {lines.map((line, idx) => (
          <div key={line.lineNo} data-active={idx === currentIndex}>
            <ConversationLineCard 
              line={line} 
              showThai={showThai} 
              isActive={idx === currentIndex} 
            />
          </div>
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="p-4 sm:p-5 border-t border-border bg-card flex flex-col-reverse sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
        <Button 
          variant="secondary" 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          ก่อนหน้า
        </Button>
        
        <Button 
          variant="primary" 
          onClick={handleNext}
          className="w-full sm:max-w-[200px] flex-1"
        >
          {currentIndex === lines.length - 1 ? "จบการฝึก" : "ถัดไป"}
          {currentIndex !== lines.length - 1 && <ChevronRight className="w-5 h-5 ml-1" />}
        </Button>
      </div>
      
      <p className="hidden sm:block text-xs text-ink-secondary mt-3 text-center pb-2">
        ใช้ปุ่ม ← → บนคีย์บอร์ดเพื่อเปลี่ยนประโยค และกด Space เพื่อเล่นหรือหยุดเสียง
      </p>
    </div>
  )
}
