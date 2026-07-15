import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
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

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const scope = user ? `user:${user.id}` : "guest"
  const [preferences, setPreferences] = useState(() => loadCachedPreferences("guest"))
  const [status, setStatus] = useState<PreferencesStatus>(authLoading ? "loading" : "ready")
  const [error, setError] = useState<string | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)
  const preferencesRef = useRef(preferences)
  const scopeRef = useRef(scope)
  const queueScopeRef = useRef(scope)
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve())
  const revisionRef = useRef(0)

  useLayoutEffect(() => {
    scopeRef.current = scope
  }, [scope])

  useEffect(() => {
    if (authLoading) {
      setStatus("loading")
      return
    }

    let active = true
    const loadRevision = revisionRef.current
    const cached = loadCachedPreferences(scope)
    preferencesRef.current = cached
    setPreferences(cached)
    setError(null)

    if (!user) {
      setStatus("ready")
      return () => { active = false }
    }

    setStatus("loading")
    void fetchUserPreferences(user.id)
      .then((remote) => {
        if (!active || revisionRef.current !== loadRevision) return
        preferencesRef.current = remote
        setPreferences(remote)
        saveCachedPreferences(scope, remote)
        setStatus("ready")
      })
      .catch(() => {
        if (!active || revisionRef.current !== loadRevision) return
        setPreferences(cached)
        setError("ไม่สามารถโหลดการตั้งค่าจากระบบได้")
        setStatus("error")
      })

    return () => { active = false }
  }, [authLoading, retryVersion, scope, user])

  useEffect(() => {
    delete document.documentElement.dataset.theme
    document.documentElement.style.colorScheme = "light"
  }, [])

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const previous = preferencesRef.current
    const next = normalizeUserPreferences({ ...previous, ...updates })
    const updateScope = scope
    const revision = revisionRef.current + 1
    revisionRef.current = revision
    preferencesRef.current = next
    setPreferences(next)
    saveCachedPreferences(scope, next)
    setError(null)

    if (!user) {
      setStatus("ready")
      return true
    }

    setStatus("saving")
    if (queueScopeRef.current !== updateScope) {
      queueScopeRef.current = updateScope
      saveQueueRef.current = Promise.resolve()
    }
    const save = saveQueueRef.current
      .catch(() => undefined)
      .then(() => upsertUserPreferences(user.id, next))
    saveQueueRef.current = save
    try {
      const saved = await save
      if (scopeRef.current !== updateScope) return true
      if (revisionRef.current !== revision) return true
      preferencesRef.current = saved
      setPreferences(saved)
      saveCachedPreferences(scope, saved)
      setStatus("ready")
      return true
    } catch {
      if (scopeRef.current !== updateScope) return false
      if (revisionRef.current !== revision) return false
      preferencesRef.current = previous
      setPreferences(previous)
      saveCachedPreferences(scope, previous)
      setError("บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
      setStatus("error")
      return false
    }
  }, [scope, user])

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    status,
    error,
    updatePreferences,
    retry: () => setRetryVersion((version) => version + 1),
  }), [error, preferences, status, updatePreferences])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
