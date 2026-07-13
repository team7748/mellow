import { useState, useRef, useEffect } from "react"
import { Info, Check } from "lucide-react"
import { SrsInfoTooltip } from "./SrsInfoTooltip"

type SrsToggleProps = {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function SrsToggle({ enabled, onChange }: SrsToggleProps) {
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
    <div className="relative flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2">
          <label htmlFor="srs-toggle" className="text-sm font-bold text-ink-DEFAULT cursor-pointer" onClick={() => onChange(!enabled)}>
            ใช้ระบบ SRS (ทบทวนตามรอบจำ)
          </label>
          <button
            type="button"
            className="text-ink-secondary hover:text-ink-secondary focus:outline-none"
            onClick={(e) => {
              e.stopPropagation()
              setShowTooltip(!showTooltip)
            }}
            aria-label="อธิบายระบบ SRS"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-secondary">
          {enabled
            ? "ระบบจะช่วยจัดวันทบทวนคำศัพท์ให้คุณ"
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
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          enabled ? "bg-primary" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        >
          {enabled && (
            <span
              className="absolute inset-0 flex h-full w-full items-center justify-center transition-opacity"
              aria-hidden="true"
            >
              <Check className="h-3 w-3 text-primary" />
            </span>
          )}
        </span>
      </button>

      {showTooltip && (
        <SrsInfoTooltip onClose={() => setShowTooltip(false)} />
      )}
    </div>
  )
}
