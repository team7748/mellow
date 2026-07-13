import { useEffect, useRef } from "react"
import { X } from "lucide-react"

type SrsInfoTooltipProps = {
  onClose: () => void
}

export function SrsInfoTooltip({ onClose }: SrsInfoTooltipProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="absolute bottom-full left-0 z-50 mb-2 w-full sm:w-[320px]"
      role="dialog"
      aria-label="ข้อมูล Spaced Repetition System"
    >
      <div
        ref={ref}
        className="relative rounded-lg border border-border bg-slate-800 p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 text-ink-secondary hover:text-white"
          aria-label="ปิดคำอธิบาย"
        >
          <X className="h-4 w-4" />
        </button>
        <h4 className="text-sm font-bold text-white mb-2">SRS คืออะไร?</h4>
        <p className="text-xs leading-relaxed text-slate-200">
          SRS คือระบบทบทวนตามรอบความจำ คำที่คุณจำไม่ได้จะกลับมาให้ทบทวนเร็วขึ้น เช่น อีกไม่กี่นาทีหรือไม่กี่ชั่วโมง ส่วนคำที่จำได้ดีจะค่อย ๆ เว้นระยะนานขึ้นเป็นหลายวัน เหมาะสำหรับจำศัพท์ระยะยาว
        </p>
        <div className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 border-b border-r border-border bg-slate-800" />
      </div>
    </div>
  )
}
