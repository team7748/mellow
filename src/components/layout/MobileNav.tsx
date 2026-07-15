import {
  BookOpen,
  House,
  Layers3,
  MessageSquare,
  PenLine,
} from "lucide-react"
import type { AppPage } from "../../App"
import { useI18n } from "../../contexts/I18nContext"
import type { TranslationKey } from "../../i18n/translations"

const mobileNavItems = [
  { label: "nav.home" as TranslationKey, icon: House, page: "home" as const },
  { label: "nav.vocabulary" as TranslationKey, icon: BookOpen, page: "vocabulary" as const },
  { label: "nav.review" as TranslationKey, icon: Layers3, page: "flashcard" as const },
  { label: "nav.quiz" as TranslationKey, icon: PenLine, page: "quiz" as const },
  { label: "nav.speak" as TranslationKey, icon: MessageSquare, page: "speak" as const },
]

type MobileNavProps = {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

export function MobileNav({ activePage, onNavigate }: MobileNavProps) {
  const { t } = useI18n()
  function isActive(page: AppPage) {
    return activePage === page || (activePage === "wordDetail" && page === "vocabulary")
  }

  return (
    <nav
      aria-label={t("nav.mobile")}
      className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur-md pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.03)]"
    >
      <div className="flex justify-evenly items-end">
        {mobileNavItems.map(({ label, icon: Icon, page }) => {
          const active = isActive(page)

          return (
            <button
              key={page}
              aria-current={active ? "page" : undefined}
              className="group flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[52px] focus:outline-none active:scale-95 transition-transform duration-300 ease-out"
              type="button"
              onClick={() => onNavigate(page)}
            >
              <div className={`relative flex items-center justify-center w-14 h-8 rounded-xl transition-all duration-300 ease-out ${active ? "bg-primary-soft" : "group-hover:bg-slate-50"}`}>
                {active ? (
                  <Icon 
                    aria-hidden="true" 
                    className="w-[22px] h-[22px] text-primary transition-all duration-300 ease-out scale-110" 
                    strokeWidth={2.25}
                    fill="currentColor"
                    fillOpacity={0.15}
                  />
                ) : (
                  <Icon 
                    aria-hidden="true" 
                    className="w-[22px] h-[22px] text-ink-secondary/70 transition-all duration-300 ease-out group-hover:scale-105 group-hover:text-ink-dark" 
                    strokeWidth={1.75}
                  />
                )}
              </div>
              <span className={`text-[10px] leading-none font-semibold transition-colors duration-300 ${active ? "text-primary" : "text-ink-secondary group-hover:text-ink-dark"}`}>
                {t(label)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
