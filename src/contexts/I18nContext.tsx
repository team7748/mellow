import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react"
import { usePreferences } from "../hooks/usePreferences"
import { translations, type TranslationKey } from "../i18n/translations"

type I18nContextValue = {
  language: "th" | "en"
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function interpolate(template: string, values: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  )
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences()
  const language = preferences.language

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<I18nContextValue>(() => ({
    language,
    t: (key, values) => interpolate(translations[language][key], values),
  }), [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n must be used within I18nProvider")
  return context
}
