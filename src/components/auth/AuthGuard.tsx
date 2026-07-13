import type { PropsWithChildren } from "react"
import { useAuth } from "../../hooks/useAuth"
import { AuthPage } from "../../pages/AuthPage"
import { Loader2 } from "lucide-react"

type AuthGuardProps = PropsWithChildren<{
  onAuthSuccess: () => void
}>

export function AuthGuard({ children, onAuthSuccess }: AuthGuardProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage onSuccess={onAuthSuccess} />
  }

  return <>{children}</>
}
