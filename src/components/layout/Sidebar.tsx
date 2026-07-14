import { useState } from "react"
import {
  BookOpen,
  House,
  Layers3,
  MessageSquare,
  PenLine,
  CircleUserRound,
  ChevronLeft,
  ChevronRight,
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
      <div className={`flex items-center h-[5.5rem] ${isCollapsed ? "justify-center px-2" : "gap-3 px-5"} cursor-pointer`} onClick={() => onNavigate("home")}>
        <img src="/logo.png" alt="Mellow Logo" className={`object-contain shrink-0 transition-all mix-blend-multiply ${isCollapsed ? "w-11 h-11" : "w-14 h-14"}`} onError={(e) => e.currentTarget.style.display = 'none'} />
        {!isCollapsed && (
          <span className="text-[1.75rem] font-black tracking-tight whitespace-nowrap overflow-hidden flex items-center">
            <span style={{ color: '#105625' }}>Mel</span>
            <span style={{ color: '#4eb439' }}>low</span>
          </span>
        )}
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="hidden md:flex absolute -right-4 top-6 z-10 h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-ink-secondary/70 shadow-sm transition-all duration-300 ease-out hover:scale-105 hover:shadow-md hover:border-primary/30 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group"
        aria-label={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-px" strokeWidth={2.5} />
        ) : (
          <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-px" strokeWidth={2.5} />
        )}
      </button>

      {/* Main Nav */}
      <nav className={`flex flex-col gap-1 mt-4 ${isCollapsed ? "px-2" : "px-3"}`}>
        {navItems.map(({ label, icon: Icon, page }) => {
          const active = isActive(page)

          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              title={isCollapsed ? label : undefined}
              className={`group relative flex items-center rounded-xl font-semibold transition-all duration-200 ease-out whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                isCollapsed ? "p-3 justify-center" : "px-4 py-3 gap-3"
              } ${
                active 
                  ? "bg-primary-soft text-primary" 
                  : "text-ink-secondary hover:bg-slate-50 hover:text-ink-dark"
              }`}
            >
              {active && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
              )}
              {active ? (
                <Icon className="w-5 h-5 shrink-0 text-primary transition-transform duration-300 ease-out scale-105" strokeWidth={2.25} fill="currentColor" fillOpacity={0.15} />
              ) : (
                <Icon className="w-5 h-5 shrink-0 text-ink-secondary/70 group-hover:text-ink-dark group-hover:scale-110 transition-all duration-300 ease-out" strokeWidth={1.75} />
              )}
              {!isCollapsed && <span className="text-[14px]">{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Nav (Profile) */}
      <nav className={`flex flex-col gap-1 mb-6 ${isCollapsed ? "px-2" : "px-3"}`}>
        <div className={`border-t border-border mb-3 ${isCollapsed ? "mx-1" : "mx-2"}`} />
        {bottomNavItems.map(({ label, icon: Icon, page }) => {
          const active = isActive(page)

          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              title={isCollapsed ? label : undefined}
              className={`group relative flex items-center rounded-xl font-semibold transition-all duration-200 ease-out whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                isCollapsed ? "p-3 justify-center" : "px-4 py-3 gap-3"
              } ${
                active 
                  ? "bg-primary-soft text-primary" 
                  : "text-ink-secondary hover:bg-slate-50 hover:text-ink-dark"
              }`}
            >
              {active && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
              )}
              {active ? (
                <Icon className="w-5 h-5 shrink-0 text-primary transition-transform duration-300 ease-out scale-105" strokeWidth={2.25} fill="currentColor" fillOpacity={0.15} />
              ) : (
                <Icon className="w-5 h-5 shrink-0 text-ink-secondary/70 group-hover:text-ink-dark group-hover:scale-110 transition-all duration-300 ease-out" strokeWidth={1.75} />
              )}
              {!isCollapsed && <span className="text-[14px]">{label}</span>}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
