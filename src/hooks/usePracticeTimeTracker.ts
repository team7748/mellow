import { useEffect, useRef } from "react"
import { recordLearningActivity } from "../lib/activity/recordLearningActivity"
import type { LearningActivityMode } from "../lib/activity/activityTypes"

const FLUSH_INTERVAL_SECONDS = 30
const IDLE_TIMEOUT_MS = 5 * 60 * 1000

type PracticeTimeTrackerOptions = {
  enabled: boolean
  mode: LearningActivityMode
  entityId: string
}

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ??
    `practice-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function usePracticeTimeTracker({
  enabled,
  mode,
  entityId,
}: PracticeTimeTrackerOptions): void {
  const sessionIdRef = useRef(createSessionId())

  useEffect(() => {
    if (!enabled || !entityId) return

    let accumulatedSeconds = 0
    let lastActivityAt = Date.now()

    const markActive = () => { lastActivityAt = Date.now() }
    const flush = () => {
      if (accumulatedSeconds <= 0) return
      const durationSeconds = Math.min(1800, accumulatedSeconds)
      accumulatedSeconds = 0
      recordLearningActivity({
        kind: "practice_time",
        mode,
        entityId,
        metadata: {
          sessionId: sessionIdRef.current,
          durationSeconds,
        },
      })
    }

    const intervalId = window.setInterval(() => {
      const active =
        document.visibilityState === "visible" &&
        Date.now() - lastActivityAt <= IDLE_TIMEOUT_MS
      if (!active) return
      accumulatedSeconds += 1
      if (accumulatedSeconds >= FLUSH_INTERVAL_SECONDS) flush()
    }, 1000)

    window.addEventListener("pointerdown", markActive)
    window.addEventListener("keydown", markActive)
    window.addEventListener("touchstart", markActive, { passive: true })

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("pointerdown", markActive)
      window.removeEventListener("keydown", markActive)
      window.removeEventListener("touchstart", markActive)
      flush()
    }
  }, [enabled, entityId, mode])
}
