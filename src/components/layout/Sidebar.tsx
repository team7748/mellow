import { useState } from "react"
import {
  BookOpen,
  House,
  Layers3,
  MessageSquare,
  PenLine,
  Leaf,
  CircleUserRound,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react"
import type { AppPage } from "../../App"

const navItems = [
  { label: "หน้าหลัก", icon: House, page: "home" as const },
  { label: "คำศัพท์", icon: BookOpen, page: "vocabulary" as const },
  { label: "ทบทวน", icon: Layers3, page: "flashcard" as const },
  { label: "แบบฝึกหัด", icon: PenLine, page: "quiz" as const },
  { label: "สนทนา", icon: MessageSquare, page: "speak" as const },
]

const bottomNavItems = [
  { label: "โปรไฟล์", icon: CircleUserRound, page: "profile" as const },
]

type SidebarProps = {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  function isActive(page: AppPage) {
    return activePage === page || (activePage === "wordDetail" && page === "vocabulary")
  }

  return (
    <aside className={`hidden md:flex flex-col h-screen sticky top-0 bg-card border-r border-border shrink-0 transition-all duration-300 relative ${isCollapsed ? "w-[80px]" : "w-[240px]"}`}>
      
      {/* Logo */}
      <div className={`flex items-center h-20 ${isCollapsed ? "justify-center px-2" : "gap-2.5 px-5"} cursor-pointer`} onClick={() => onNavigate("home")}>
        <img src="/logo.png" alt="KengSap Logo" className={`object-contain shrink-0 transition-all ${isCollapsed ? "w-10 h-10" : "w-12 h-12"}`} onError={(e) => e.currentTarget.style.display = 'none'} />
        {!isCollapsed && (
          <span className="text-2xl font-bold tracking-tight whitespace-nowrap overflow-hidden flex items-center">
            <span style={{ color: '#105625' }}>Keng</span>
            <span style={{ color: '#4eb439' }}>Sap</span>
          </span>
        )}
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="hidden md:flex items-center justify-center absolute -right-3 top-[1.125rem] w-6 h-6 bg-card border border-border text-ink-secondary hover:text-primary hover:border-primary/40 rounded-full shadow-sm transition-all z-10"
        aria-label={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} /> : <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />}
      </button>

      {/* Main Nav */}
      <nav className={`flex flex-col gap-0.5 mt-4 ${isCollapsed ? "px-2" : "px-3"}`}>
        {navItems.map(({ label, icon: Icon, page }) => {
          const active = isActive(page)

          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              title={isCollapsed ? label : undefined}
              className={`flex items-center rounded-xl font-semibold transition-all duration-150 overflow-hidden whitespace-nowrap ${
                isCollapsed ? "p-3 justify-center" : "px-4 py-3 gap-3"
              } ${
                active 
                  ? "bg-primary-active text-primary" 
                  : "text-ink-secondary hover:bg-page hover:text-ink-dark"
              }`}
            >
              {active ? (
                <Icon className="w-5 h-5 shrink-0 text-primary" strokeWidth={2.25} fill="currentColor" fillOpacity={0.15} />
              ) : (
                <Icon className="w-5 h-5 shrink-0 text-ink-secondary" strokeWidth={1.75} />
              )}
              {!isCollapsed && <span className="text-[14px]">{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Nav (Profile) */}
      <nav className={`flex flex-col gap-0.5 mb-6 ${isCollapsed ? "px-2" : "px-3"}`}>
        <div className={`border-t border-border mb-3 ${isCollapsed ? "mx-1" : "mx-2"}`} />
        {bottomNavItems.map(({ label, icon: Icon, page }) => {
          const active = isActive(page)

          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              title={isCollapsed ? label : undefined}
              className={`flex items-center rounded-xl font-semibold transition-all duration-150 overflow-hidden whitespace-nowrap ${
                isCollapsed ? "p-3 justify-center" : "px-4 py-3 gap-3"
              } ${
                active 
                  ? "bg-primary-active text-primary" 
                  : "text-ink-secondary hover:bg-page hover:text-ink-dark"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : "text-ink-secondary"}`} strokeWidth={active ? 2.25 : 1.75} />
              {!isCollapsed && <span className="text-[14px]">{label}</span>}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
