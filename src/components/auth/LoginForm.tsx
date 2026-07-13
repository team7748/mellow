import { useState } from "react"
import { loginWithEmail } from "../../services/authService"
import { Button } from "../ui/Button"
import { Loader2, Eye, EyeOff } from "lucide-react"

type LoginFormProps = {
  onSuccess: () => void
  onSwitchToRegister: () => void
  onSwitchToForgot: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister, onSwitchToForgot }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { success, error: authError } = await loginWithEmail(email, password)
    
    setIsLoading(false)
    if (success) {
      onSuccess()
    } else {
      setError(authError || "เข้าสู่ระบบไม่สำเร็จ")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600 ring-1 ring-rose-200 animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT" htmlFor="login-email">
          อีเมล
        </label>
        <input
          id="login-email"
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
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-ink-DEFAULT" htmlFor="login-password">
            รหัสผ่าน
          </label>
          <button
            type="button"
            onClick={onSwitchToForgot}
            className="text-xs font-semibold text-primary hover:underline"
            disabled={isLoading}
          >
            ลืมรหัสผ่าน?
          </button>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary pr-10"
            placeholder="••••••••"
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
      <Button type="submit" className="w-full mt-2" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
        เข้าสู่ระบบ
      </Button>
      <p className="text-center text-sm text-ink-secondary mt-4">
        ยังไม่มีบัญชีใช่ไหม?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-primary hover:underline"
          disabled={isLoading}
        >
          สมัครสมาชิก
        </button>
      </p>
    </form>
  )
}
