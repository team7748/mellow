import { BookOpen, BarChart3, Layers3, Search } from "lucide-react"
import type { AppPage } from "../../App"
import { Container } from "./Container"

const navItems = [
  { label: "คำศัพท์", icon: BookOpen, page: "vocabulary" as const },
  { label: "ฝึกจำ", icon: Layers3, page: "flashcard" as const },
  { label: "ทดสอบ", icon: Search, page: "quiz" as const },
  { label: "สรุปผล", icon: BarChart3, page: "home" as const },
]

type NavigationProps = {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

export function Navigation({ activePage, onNavigate }: NavigationProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-paper/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-3">
        <button
          className="flex items-center gap-2 font-semibold text-ink"
          type="button"
          onClick={() => onNavigate("home")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-leaf text-white">
            EN
          </span>
          <span className="hidden sm:inline">จำศัพท์อังกฤษ</span>
        </button>

        <nav aria-label="เมนูหลัก" className="flex items-center gap-1">
          {navItems.map(({ label, icon: Icon, page }) => {
            const isActive =
              (activePage === page && page !== "home") ||
              (activePage === "wordDetail" && page === "vocabulary")

            return (
            <button
              key={label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-leaf focus:ring-offset-2 focus:ring-offset-paper sm:w-auto sm:gap-2 sm:px-3 ${
                isActive
                  ? "bg-white text-leaf shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-leaf"
              }`}
              type="button"
              title={label}
              onClick={() => onNavigate(page)}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span className="hidden text-sm font-medium sm:inline">{label}</span>
            </button>
            )
          })}
        </nav>
      </Container>
    </header>
  )
}
