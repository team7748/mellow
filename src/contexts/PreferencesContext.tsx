import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "../hooks/useAuth"
import {
  loadCachedPreferences,
  saveCachedPreferences,
} from "../lib/preferences/preferencesStorage"
import {
  fetchUserPreferences,
  upsertUserPreferences,
} from "../services/preferencesService"
import {
  normalizeUserPreferences,
  type UserPreferences,
} from "../types/preferences"

export type PreferencesStatus = "loading" | "ready" | "saving" | "error"

export type PreferencesContextValue = {
  preferences: UserPreferences
  status: PreferencesStatus
  error: string | null
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>
  retry: () => void
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function resolveTheme(theme: UserPreferences["theme"]): "light" | "dark" {
  if (theme !== "system") return theme
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const scope = user ? `user:${user.id}` : "guest"
  const [preferences, setPreferences] = useState(() => loadCachedPreferences("guest"))
  const [status, setStatus] = useState<PreferencesStatus>(authLoading ? "loading" : "ready")
  const [error, setError] = useState<string | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)

  useEffect(() => {
    if (authLoading) {
      setStatus("loading")
      return
    }

    let active = true
    const cached = loadCachedPreferences(scope)
    setPreferences(cached)
    setError(null)

    if (!user) {
      setStatus("ready")
      return () => { active = false }
    }

    setStatus("loading")
    void fetchUserPreferences(user.id)
      .then((remote) => {
        if (!active) return
        setPreferences(remote)
        saveCachedPreferences(scope, remote)
        setStatus("ready")
      })
      .catch(() => {
        if (!active) return
        setPreferences(cached)
        setError("ไม่สามารถโหลดการตั้งค่าจากระบบได้")
        setStatus("error")
      })

    return () => { active = false }
  }, [authLoading, retryVersion, scope, user])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const applyTheme = () => {
      document.documentElement.dataset.theme = resolveTheme(preferences.theme)
      document.documentElement.style.colorScheme = resolveTheme(preferences.theme)
    }
    applyTheme()
    if (preferences.theme !== "system") return
    media.addEventListener("change", applyTheme)
    return () => media.removeEventListener("change", applyTheme)
  }, [preferences.theme])

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const previous = preferences
    const next = normalizeUserPreferences({ ...previous, ...updates })
    setPreferences(next)
    saveCachedPreferences(scope, next)
    setError(null)

    if (!user) {
      setStatus("ready")
      return true
    }

    setStatus("saving")
    try {
      const saved = await upsertUserPreferences(user.id, next)
      setPreferences(saved)
      saveCachedPreferences(scope, saved)
      setStatus("ready")
      return true
    } catch {
      setPreferences(previous)
      saveCachedPreferences(scope, previous)
      setError("บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
      setStatus("error")
      return false
    }
  }, [preferences, scope, user])

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    status,
    error,
    updatePreferences,
    retry: () => setRetryVersion((version) => version + 1),
  }), [error, preferences, status, updatePreferences])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
