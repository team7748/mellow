import { CircleUserRound } from "lucide-react"
import type { AppPage } from "../../App"

type MobileHeaderProps = {
  onNavigate?: (page: AppPage) => void
}

export function MobileHeader({ onNavigate }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-card/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border">
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate?.("home")}>
        <img src="/logo.png" alt="Mellow Logo" className="w-[3.25rem] h-[3.25rem] object-contain mix-blend-multiply" onError={(e) => e.currentTarget.style.display = 'none'} />
        <span className="text-[1.75rem] font-black tracking-tight flex items-center">
          <span style={{ color: '#105625' }}>Mel</span>
          <span style={{ color: '#4eb439' }}>low</span>
        </span>
      </div>
      <button 
        onClick={() => onNavigate?.("profile")}
        className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-primary/25 text-primary hover:border-primary/50 hover:bg-primary-soft transition-all"
        aria-label="โปรไฟล์"
      >
        <CircleUserRound className="w-5 h-5" strokeWidth={1.75} />
      </button>
    </header>
  )
}
