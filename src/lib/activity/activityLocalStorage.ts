import type { LearningActivityLedger } from "./activityTypes"
import {
  createEmptyActivityLedger,
  normalizeActivityLedger,
} from "./activityNormalizer"
import {
  GUEST_ACTIVITY_CLAIMED_BY_KEY,
  GUEST_INSTALLATION_ID_KEY,
  getActivityStorageKey,
} from "./activityKeys"

export const ACTIVITY_LEDGER_CHANGED_EVENT =
  "english-app:learning-activity-changed"

export function loadLocalActivityLedger(
  userId?: string | null,
): LearningActivityLedger {
  const raw = localStorage.getItem(getActivityStorageKey(userId))
  if (!raw) return createEmptyActivityLedger()

  try {
    return normalizeActivityLedger(JSON.parse(raw))
  } catch {
    return createEmptyActivityLedger()
  }
}

export function saveLocalActivityLedger(
  userId: string | null | undefined,
  ledger: LearningActivityLedger,
): LearningActivityLedger {
  const normalized = normalizeActivityLedger(ledger)
  const storageKey = getActivityStorageKey(userId)
  localStorage.setItem(storageKey, JSON.stringify(normalized))

  if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ACTIVITY_LEDGER_CHANGED_EVENT, {
        detail: { storageKey },
      }),
    )
  }

  return normalized
}

export function getGuestActivityClaimedBy(): string | null {
  const userId = localStorage.getItem(GUEST_ACTIVITY_CLAIMED_BY_KEY)
  return userId && userId.trim().length > 0 ? userId : null
}

export function setGuestActivityClaimedBy(userId: string): void {
  if (!userId.trim()) return
  localStorage.setItem(GUEST_ACTIVITY_CLAIMED_BY_KEY, userId)
}

export function getGuestInstallationId(): string {
  const existing = localStorage.getItem(GUEST_INSTALLATION_ID_KEY)
  if (existing?.trim()) return existing

  const installationId =
    globalThis.crypto?.randomUUID?.() ??
    `installation-${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem(GUEST_INSTALLATION_ID_KEY, installationId)
  return installationId
}
