import { useState } from "react"
import { LoginForm } from "../components/auth/LoginForm"
import { RegisterForm } from "../components/auth/RegisterForm"
import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm"
import { PageContainer } from "../components/layout/PageContainer"
import { Lock, UserPlus, KeyRound } from "lucide-react"

type AuthPageProps = {
  onSuccess: () => void
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [view, setView] = useState<"login" | "register" | "forgot">("login")

  return (
    <PageContainer className="py-12 sm:py-20 flex justify-center">
      <div className="w-full max-w-md surface-card p-6 sm:p-8">
        <div className="flex flex-col items-center mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mb-4 shadow-sm">
            {view === "login" ? (
              <Lock className="h-6 w-6" />
            ) : view === "register" ? (
              <UserPlus className="h-6 w-6" />
            ) : (
              <KeyRound className="h-6 w-6" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-ink-DEFAULT">
            {view === "login"
              ? "เข้าสู่ระบบ"
              : view === "register"
              ? "สมัครสมาชิก"
              : "ลืมรหัสผ่าน"}
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            {view === "login"
              ? "เพื่อซิงค์ข้อมูลคำศัพท์และความคืบหน้าของคุณ"
              : view === "register"
              ? "สร้างบัญชีใหม่เพื่อเรียนรู้ได้อย่างต่อเนื่อง"
              : "เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้คุณ"}
          </p>
        </div>

        {view === "login" && (
          <LoginForm
            onSuccess={onSuccess}
            onSwitchToRegister={() => setView("register")}
            onSwitchToForgot={() => setView("forgot")}
          />
        )}

        {view === "register" && (
          <RegisterForm
            onSuccess={onSuccess}
            onSwitchToLogin={() => setView("login")}
          />
        )}

        {view === "forgot" && (
          <ForgotPasswordForm onBackToLogin={() => setView("login")} />
        )}
      </div>
    </PageContainer>
  )
}
