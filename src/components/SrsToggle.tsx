import { useState, useRef, useEffect } from "react"
import { Info, Check } from "lucide-react"
import { SrsInfoTooltip } from "./SrsInfoTooltip"

type SrsToggleProps = {
  enabled: boolean
  onChange: (enabled: boolean) => void
  className?: string
}

export function SrsToggle({ enabled, onChange, className = "" }: SrsToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const pressTimer = useRef<number | null>(null)
  const isLongPress = useRef(false)

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    isLongPress.current = false
    pressTimer.current = window.setTimeout(() => {
      isLongPress.current = true
      setShowTooltip(true)
    }, 500)
  }

  function handleEnd(e: React.MouseEvent | React.TouchEvent) {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  function handleClick(e: React.MouseEvent) {
    if (isLongPress.current) {
      e.preventDefault()
      isLongPress.current = false
      return
    }
    onChange(!enabled)
  }

  return (
    <div 
      className={`relative flex items-center justify-between rounded-xl border p-2 sm:py-2.5 sm:px-4 transition-all duration-500 ${
        enabled 
          ? "border-primary bg-primary-soft/60 shadow-sm" 
          : "border-primary/20 bg-gradient-to-br from-card to-primary-soft/10 shadow-sm"
      } ${className}`}
    >
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2">
          <label htmlFor="srs-toggle" className={`text-sm font-bold cursor-pointer transition-colors duration-300 ${enabled ? "text-primary" : "text-ink-DEFAULT"}`} onClick={() => onChange(!enabled)}>
            ใช้ระบบ SRS (ทบทวนตามรอบจำ)
          </label>
          <button
            type="button"
            className={`p-1 rounded-full transition-all focus:outline-none active:scale-95 ${enabled ? "text-primary/60 hover:text-primary hover:bg-primary/10" : "text-ink-secondary hover:text-ink-DEFAULT hover:bg-slate-100"}`}
            onClick={(e) => {
              e.stopPropagation()
              setShowTooltip(!showTooltip)
            }}
            aria-label="อธิบายระบบ SRS"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
        <p className={`mt-0.5 text-xs transition-colors duration-300 ${enabled ? "text-primary/80 font-medium" : "text-ink-secondary"}`}>
          {enabled
            ? "✨ จัดวันทบทวนคำศัพท์อัตโนมัติ"
            : "ฝึกแบบธรรมดา ไม่คำนวณรอบทบทวน"}
        </p>
      </div>

      <button
        id="srs-toggle"
        role="switch"
        aria-checked={enabled}
        aria-label="เปิดหรือปิดระบบ SRS"
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onClick={handleClick}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:scale-105 active:scale-95 ${
          enabled ? "bg-primary shadow-inner" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card ring-0 transition-transform duration-400 ${
            enabled ? "translate-x-4 shadow-[0_0_8px_rgba(0,0,0,0.15)]" : "translate-x-0 shadow-sm"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
      </button>

      {showTooltip && (
        <SrsInfoTooltip onClose={() => setShowTooltip(false)} />
      )}
    </div>
  )
}
