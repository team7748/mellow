import { useEffect, useState } from "react"
import { getActivityStorageKey } from "../lib/activity/activityKeys"
import {
  ACTIVITY_LEDGER_CHANGED_EVENT,
  loadLocalActivityLedger,
} from "../lib/activity/activityLocalStorage"
import type { LearningActivityLedger } from "../lib/activity/activityTypes"

export function useLearningActivityLedger(
  userId?: string | null,
): LearningActivityLedger {
  const storageKey = getActivityStorageKey(userId)
  const [ledger, setLedger] = useState(() =>
    loadLocalActivityLedger(userId),
  )

  useEffect(() => {
    const reload = () => setLedger(loadLocalActivityLedger(userId))
    const handleActivityChange = (event: Event) => {
      const changedKey = (event as CustomEvent<{ storageKey?: string }>).detail
        ?.storageKey
      if (changedKey === storageKey) reload()
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) reload()
    }

    reload()
    window.addEventListener(
      ACTIVITY_LEDGER_CHANGED_EVENT,
      handleActivityChange,
    )
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener(
        ACTIVITY_LEDGER_CHANGED_EVENT,
        handleActivityChange,
      )
      window.removeEventListener("storage", handleStorage)
    }
  }, [storageKey, userId])

  return ledger
}
