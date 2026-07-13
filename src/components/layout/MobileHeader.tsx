import { CircleUserRound, Leaf } from "lucide-react"
import type { AppPage } from "../../App"

type MobileHeaderProps = {
  onNavigate?: (page: AppPage) => void
}

export function MobileHeader({ onNavigate }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-card/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate?.("home")}>
        <img src="/logo.png" alt="KengSap Logo" className="w-11 h-11 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
        <span className="text-2xl font-bold tracking-tight flex items-center">
          <span style={{ color: '#105625' }}>Keng</span>
          <span style={{ color: '#4eb439' }}>Sap</span>
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
