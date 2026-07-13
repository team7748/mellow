import { useState } from "react"
import { registerWithEmail } from "../../services/authService"
import { Button } from "../ui/Button"
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"

type RegisterFormProps = {
  onSuccess: () => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      return
    }

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      return
    }

    setIsLoading(true)
    const { success, error: authError, message } = await registerWithEmail(email, password, displayName)
    setIsLoading(false)

    if (success) {
      if (message) {
        setSuccessMsg(message)
        // Delay before redirect if needed, but App automatically updates if session is set.
        setTimeout(() => onSuccess(), 2000)
      } else {
        onSuccess()
      }
    } else {
      setError(authError || "สมัครสมาชิกไม่สำเร็จ")
    }
  }

  if (successMsg) {
    return (
      <div className="text-center space-y-4 animate-in zoom-in-95 duration-500 py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-active mb-4">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-ink-DEFAULT">สมัครสมาชิกสำเร็จ!</h3>
        <p className="text-sm text-ink-secondary">{successMsg}</p>
        <p className="text-xs text-ink-secondary mt-2">กำลังพากลับหน้าหลัก...</p>
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
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT" htmlFor="reg-name">
          ชื่อที่แสดง (Display Name)
        </label>
        <input
          id="reg-name"
          type="text"
          required
          className="w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="John Doe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT" htmlFor="reg-email">
          อีเมล
        </label>
        <input
          id="reg-email"
          type="email"
          required
          className="w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT" htmlFor="reg-password">
          รหัสผ่าน
        </label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            className="w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary pr-10"
            placeholder="อย่างน้อย 6 ตัวอักษร"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-secondary hover:text-ink-secondary focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT" htmlFor="reg-confirm">
          ยืนยันรหัสผ่าน
        </label>
        <div className="relative">
          <input
            id="reg-confirm"
            type={showConfirmPassword ? "text" : "password"}
            required
            minLength={6}
            className="w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary pr-10"
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-secondary hover:text-ink-secondary focus:outline-none"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
            aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full mt-2" disabled={isLoading || !!successMsg}>
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
        สมัครสมาชิก
      </Button>
      <p className="text-center text-sm text-ink-secondary mt-4">
        มีบัญชีอยู่แล้วใช่ไหม?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-primary hover:underline"
          disabled={isLoading}
        >
          เข้าสู่ระบบ
        </button>
      </p>
    </form>
  )
}
