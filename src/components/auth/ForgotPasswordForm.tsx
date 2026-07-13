import { useState } from "react"
import { resetPasswordForEmail } from "../../services/authService"
import { Button } from "../ui/Button"
import { Loader2 } from "lucide-react"

type ForgotPasswordFormProps = {
  onBackToLogin: () => void
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await resetPasswordForEmail(email)
    
    setIsLoading(false)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || "เกิดข้อผิดพลาดในการส่งอีเมล")
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4 animate-in zoom-in-95 duration-500 py-4">
        <div className="rounded-lg bg-primary-soft p-4 text-sm text-primary ring-1 ring-primary/20">
          เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ
        </div>
        <Button onClick={onBackToLogin} variant="secondary" className="w-full">
          กลับไปหน้าเข้าสู่ระบบ
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600 ring-1 ring-rose-200 animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}
      <p className="text-sm text-ink-secondary">
        กรอกอีเมลของคุณด้านล่าง เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้
      </p>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT" htmlFor="reset-email">
          อีเมล
        </label>
        <input
          id="reset-email"
          type="email"
          required
          className="w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onBackToLogin} className="flex-1" disabled={isLoading}>
          ยกเลิก
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          ส่งอีเมล
        </Button>
      </div>
    </form>
  )
}
