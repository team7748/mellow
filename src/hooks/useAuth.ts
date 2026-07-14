import { useSyncExternalStore } from "react"
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js"
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

const initialState: AuthState = { session: null, user: null, isLoading: true }
let snapshot = initialState
let started = false
let subscriberCount = 0
let subscription: { unsubscribe: () => void } | null = null
let listeners = new Set<() => void>()

function publish(next: AuthState): void {
  snapshot = next
  listeners.forEach((listener) => listener())
}

function cancelSync(): void {
  handleVocabularySignOut()
  handleActivitySignOut()
}

function syncUser(userId: string): void {
  void Promise.allSettled([
    Promise.resolve().then(() => handleVocabularySignIn(userId)),
    Promise.resolve().then(() => handleActivitySignIn(userId)),
  ])
}

function handleAuthChange(event: AuthChangeEvent, nextSession: Session | null): void {
  publish({ session: nextSession, user: nextSession?.user ?? null, isLoading: false })

  if (event === "SIGNED_OUT") {
    cancelSync()
    return
  }

  if (nextSession?.user && event === "SIGNED_IN") {
    cancelSync()
    syncUser(nextSession.user.id)
  }
}

function startAuth(): void {
  if (started) return
  started = true
  runLegacyMigration()

  const result = supabase.auth.onAuthStateChange(handleAuthChange)
  subscription = result.data.subscription

  void supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      cancelSync()
      publish({ session: null, user: null, isLoading: false })
      return
    }

    publish({ session, user: session?.user ?? null, isLoading: false })
    if (session?.user) syncUser(session.user.id)
  }).catch(() => {
    cancelSync()
    publish({ session: null, user: null, isLoading: false })
  })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  subscriberCount += 1
  startAuth()

  return () => {
    listeners.delete(listener)
    subscriberCount = Math.max(0, subscriberCount - 1)
    if (subscriberCount === 0) {
      subscription?.unsubscribe()
      subscription = null
      started = false
      cancelSync()
      snapshot = initialState
    }
  }
}

export function useAuth(): AuthState {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => initialState)
  return state
}
