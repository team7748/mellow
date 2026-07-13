import {
  BookOpen,
  House,
  Layers3,
  MessageSquare,
  PenLine,
  Leaf,
} from "lucide-react"
import type { AppPage } from "../../App"

const mobileNavItems = [
  { label: "หน้าหลัก", icon: House, page: "home" as const },
  { label: "คำศัพท์", icon: BookOpen, page: "vocabulary" as const },
  { label: "ทบทวน", icon: Layers3, page: "flashcard" as const },
  { label: "แบบฝึกหัด", icon: PenLine, page: "quiz" as const },
  { label: "สนทนา", icon: MessageSquare, page: "speak" as const },
]

type MobileNavProps = {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

export function MobileNav({ activePage, onNavigate }: MobileNavProps) {
  function isActive(page: AppPage) {
    return activePage === page || (activePage === "wordDetail" && page === "vocabulary")
  }

  return (
    <nav
      aria-label="เมนูหลักบนมือถือ"
      className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-2px_12px_rgba(35,60,42,0.06)]"
    >
      <div className="flex justify-evenly items-end">
        {mobileNavItems.map(({ label, icon: Icon, page }) => {
          const active = isActive(page)

          return (
            <button
              key={page}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[52px] focus:outline-none active:scale-[0.92] transition-transform"
              type="button"
              onClick={() => onNavigate(page)}
            >
              <div className={`flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200 ${active ? "bg-primary-active" : ""}`}>
                {active ? (
                  <Icon 
                    aria-hidden="true" 
                    className="w-[22px] h-[22px] text-primary" 
                    strokeWidth={2.5}
                    fill="currentColor"
                    fillOpacity={0.15}
                  />
                ) : (
                  <Icon 
                    aria-hidden="true" 
                    className="w-[22px] h-[22px] text-ink-secondary" 
                    strokeWidth={1.75}
                  />
                )}
              </div>
              <span className={`text-[10px] leading-tight font-semibold ${active ? "text-primary" : "text-ink-secondary"}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
