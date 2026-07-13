import { useState, useRef, useEffect } from "react"
import { logout } from "../../services/authService"
import { LogOut, User as UserIcon, UserCircle } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "../../types/profile"

type UserMenuProps = {
  onNavigate: (page: "auth" | "profile") => void
  user: User | null
  isLoading: boolean
  profile: UserProfile | null
}

export function UserMenu({ onNavigate, user, isLoading, profile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (isLoading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
  }

  if (!user) {
    return (
      <button
        onClick={() => onNavigate("auth")}
        className="flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-sm font-semibold text-primary ring-1 ring-primary/20 transition-colors hover:bg-primary-active"
      >
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">เข้าสู่ระบบ</span>
      </button>
    )
  }

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User"
  const avatarText = displayName.substring(0, 2).toUpperCase()

  async function handleLogout() {
    await logout()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white font-bold text-sm shadow-sm ring-2 ring-white hover:ring-primary/20 transition-all focus:outline-none"
      >
        {avatarText}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-semibold text-ink-DEFAULT truncate">{displayName}</p>
            <p className="text-xs font-medium text-ink-secondary truncate">{user.email}</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => {
                onNavigate("profile")
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-DEFAULT hover:bg-slate-50 hover:text-primary transition-colors"
            >
              <UserCircle className="h-4 w-4" />
              โปรไฟล์ของฉัน
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
