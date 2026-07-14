import type { PropsWithChildren } from "react"
import type { AppPage } from "../../App"
import { Sidebar } from "./Sidebar"
import { MobileNav } from "./MobileNav"
import { MobileHeader } from "./MobileHeader"

type AppLayoutProps = PropsWithChildren<{
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}>

export function AppLayout({ activePage, children, onNavigate }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-card text-ink-dark antialiased flex">
      {/* Desktop Sidebar */}
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div
        data-app-scroll-container="true"
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto"
      >
        <MobileHeader onNavigate={onNavigate} />
        
        <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8 px-4 sm:px-6 lg:px-12 xl:px-24">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activePage={activePage} onNavigate={onNavigate} />
    </div>
  )
}
