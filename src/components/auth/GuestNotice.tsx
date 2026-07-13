import { useState, useEffect } from "react"
import { useAuth } from "../../hooks/useAuth"
import { LogIn, X } from "lucide-react"

type GuestNoticeProps = {
  onLoginClick: () => void
}

export function GuestNotice({ onLoginClick }: GuestNoticeProps) {
  const { user, isLoading } = useAuth()
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem("guest-notice-dismissed")
    if (dismissed === "true") {
      setIsDismissed(true)
    }
  }, [])

  function handleDismiss() {
    setIsDismissed(true)
    sessionStorage.setItem("guest-notice-dismissed", "true")
  }

  if (isLoading || user || isDismissed) return null

  return (
    <div className="mt-6 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-slate-50 p-4 sm:p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-sm group">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 text-ink-secondary hover:text-ink-secondary hover:bg-slate-200/50 rounded-full transition-colors"
        aria-label="ปิดแจ้งเตือน"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="pr-6">
        <p className="text-sm font-semibold text-ink-DEFAULT group-hover:text-primary transition-colors duration-300">ทดลองใช้งานชั่วคราว</p>
        <p className="mt-1 text-xs text-ink-secondary sm:text-sm">
          ข้อมูลความคืบหน้าจะถูกบันทึกแค่ในอุปกรณ์นี้ สมัครสมาชิกฟรีเพื่อซิงค์ข้อมูลเรียนต่อได้ทุกที่
        </p>
      </div>
      <button
        onClick={onLoginClick}
        className="shrink-0 flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-semibold text-primary ring-1 ring-primary/20 hover:bg-primary hover:text-white transition-all duration-200 active:scale-95 w-full sm:w-auto justify-center"
      >
        <LogIn className="h-4 w-4" />
        บันทึกความคืบหน้าถาวร
      </button>
    </div>
  )
}
