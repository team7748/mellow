import { useState, type FormEvent } from "react"
import { ChevronDown, KeyRound, Loader2, LogOut } from "lucide-react"
import { logout, resetPasswordForEmail, updatePassword } from "../../services/authService"
import { disablePushNotifications } from "../../lib/notifications/pushNotifications"


const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"

export function AccountSecurity({ email, userId }: { email: string; userId: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState<"password" | "reset" | "logout" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  function clearFeedback() {
    setError(null)
    setMessage(null)
  }

  async function handlePassword(event: FormEvent) {
    event.preventDefault()
    clearFeedback()
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      return
    }
    if (password !== confirmation) {
      setError("รหัสผ่านไม่ตรงกัน")
      return
    }
    setBusy("password")
    const result = await updatePassword(password)
    setBusy(null)
    if (!result.success) {
      setError(result.error ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ")
      return
    }
    setPassword("")
    setConfirmation("")
    setMessage("เปลี่ยนรหัสผ่านแล้ว")
  }

  async function handleReset() {
    clearFeedback()
    setBusy("reset")
    const result = await resetPasswordForEmail(email)
    setBusy(null)
    if (result.success) {
      setMessage("ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบกล่องจดหมาย")
    } else {
      setError(result.error ?? "ส่งอีเมลไม่สำเร็จ")
    }
  }

  async function handleLogout() {
    clearFeedback()
    setBusy("logout")
    try {
      await disablePushNotifications(userId)
    } catch {
      // Signing out must still succeed; either local unsubscribe or server
      // cleanup may already have invalidated this device's endpoint.
    }
    const result = await logout()
    if (!result.success) {
      setBusy(null)
      setError(result.error ?? "ออกจากระบบไม่สำเร็จ")
    }
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80">
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-ink-secondary"><KeyRound className="h-4 w-4" aria-hidden="true" /></span>
            <span><span className="block text-sm font-semibold text-ink">ความปลอดภัย</span><span className="block text-xs text-ink-secondary">เปลี่ยนหรือรีเซ็ตรหัสผ่าน</span></span>
          </span>
          <ChevronDown className={`h-4 w-4 text-ink-secondary transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {open ? (
          <div className="space-y-4 border-t border-border/40 bg-slate-50/50 px-4 py-4">
            <form onSubmit={handlePassword} className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-ink-secondary">รหัสผ่านใหม่<input aria-label="รหัสผ่านใหม่" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold text-ink-secondary">ยืนยันรหัสผ่านใหม่<input aria-label="ยืนยันรหัสผ่านใหม่" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClass} /></label>
              <button type="submit" disabled={busy !== null} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 sm:col-span-2">{busy === "password" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-label="กำลังบันทึก" /> : "เปลี่ยนรหัสผ่าน"}</button>
            </form>
            <div className="border-t border-border/40 pt-4">
              <p className="text-xs text-ink-secondary">หากจำรหัสผ่านไม่ได้ ระบบจะส่งลิงก์ไปที่ {email}</p>
              <button type="button" onClick={() => void handleReset()} disabled={busy !== null} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:border-primary/30 hover:text-primary disabled:opacity-50">{busy === "reset" ? "กำลังส่ง..." : "ส่งอีเมลรีเซ็ตรหัสผ่าน"}</button>
            </div>
          </div>
        ) : null}
      </div>
      {error ? <p role="alert" className="text-sm font-medium text-red-600">{error}</p> : null}
      {message ? <p role="status" className="text-sm font-medium text-primary">{message}</p> : null}
      <div className="flex justify-center pb-8 pt-2">
        <button type="button" onClick={() => setShowLogoutConfirm(true)} disabled={busy !== null} className="flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50">
          {busy === "logout" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
          ออกจากระบบ
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-ink">คุณแน่ใจหรือไม่?</h3>
            <p className="mt-2 text-sm text-ink-secondary">ความก้าวหน้าของคุณจะถูกบันทึกไว้อย่างปลอดภัยและคุณสามารถเข้าสู่ระบบเพื่อเรียนต่อได้เสมอ</p>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => {
                  setShowLogoutConfirm(false)
                  void handleLogout()
                }} 
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
