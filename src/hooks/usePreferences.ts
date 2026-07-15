import { useCallback, useContext, useState } from "react"
import { PreferencesContext } from "../contexts/PreferencesContext"
import { loadCachedPreferences, saveCachedPreferences } from "../lib/preferences/preferencesStorage"
import { normalizeUserPreferences, type UserPreferences } from "../types/preferences"

export function usePreferences() {
  const context = useContext(PreferencesContext)
  const [standalone, setStandalone] = useState(() => loadCachedPreferences("guest"))
  const updateStandalone = useCallback(async (updates: Partial<UserPreferences>) => {
    const next = normalizeUserPreferences({ ...standalone, ...updates })
    setStandalone(next)
    saveCachedPreferences("guest", next)
    return true
  }, [standalone])

  return context ?? {
    preferences: standalone,
    status: "ready" as const,
    error: null,
    updatePreferences: updateStandalone,
    retry: () => undefined,
  }
}
