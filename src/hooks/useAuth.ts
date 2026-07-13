import { useState, useEffect, useRef } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabaseClient"
import type { AuthState } from "../types/auth"
import {
  handleSignIn as handleVocabularySignIn,
  handleSignOut as handleVocabularySignOut,
} from "../lib/progress/syncManager"
import {
  handleActivitySignIn,
  handleActivitySignOut,
} from "../lib/activity/activitySyncManager"
import { runLegacyMigration } from "../lib/progress/legacyProgressMigration"

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initialSyncCompleted = useRef(false)
  const lastSyncedUserId = useRef<string | null>(null)

  useEffect(() => {
    const cancelCurrentSync = () => {
      handleVocabularySignOut()
      handleActivitySignOut()
    }

    const syncUser = (userId: string) => {
      if (
        lastSyncedUserId.current === userId &&
        initialSyncCompleted.current
      ) {
        return
      }

      if (
        lastSyncedUserId.current &&
        lastSyncedUserId.current !== userId
      ) {
        cancelCurrentSync()
      }

      lastSyncedUserId.current = userId
      initialSyncCompleted.current = true

      void Promise.allSettled([
        Promise.resolve().then(() => handleVocabularySignIn(userId)),
        Promise.resolve().then(() => handleActivitySignIn(userId)),
      ])
    }

    const syncSignedOut = () => {
      cancelCurrentSync()
      lastSyncedUserId.current = null
      initialSyncCompleted.current = false
    }

    // Run legacy migration once on startup
    runLegacyMigration()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user || null)
      setIsLoading(false)

      if (session?.user) {
        syncUser(session.user.id)
      }
    })

    // Listen for auth changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user || null)
      setIsLoading(false)

      if (event === "SIGNED_IN" && session?.user) {
        syncUser(session.user.id)
      }

      if (event === "SIGNED_OUT") {
        syncSignedOut()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { session, user, isLoading }
}
