import {
  getGuestActivityClaimedBy,
  loadLocalActivityLedger,
  saveLocalActivityLedger,
  setGuestActivityClaimedBy,
} from "./activityLocalStorage"
import {
  loadCloudActivityLedger,
  upsertCloudActivityEvents,
} from "./activityCloudRepository"
import { mergeActivityLedgers } from "./activityMerge"
import type { LearningActivityLedger } from "./activityTypes"

const SYNC_DEBOUNCE_MS = 2_000
const MAX_RETRIES = 3

let activeUserId: string | null = null
let generation = 0
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let isSyncing = false
let pendingSync = false
let retryCount = 0

function isLedgerEmpty(ledger: LearningActivityLedger): boolean {
  return ledger.events.length === 0
}

function isCurrent(userId: string, currentGeneration: number): boolean {
  return activeUserId === userId && generation === currentGeneration
}

function clearDebounceTimer(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = null
}

export function getActiveActivityUserId(): string | null {
  return activeUserId
}

export function handleActivitySignOut(): void {
  generation += 1
  clearDebounceTimer()
  activeUserId = null
  isSyncing = false
  pendingSync = false
  retryCount = 0
}

export async function handleActivitySignIn(userId: string): Promise<void> {
  if (activeUserId === userId) return

  handleActivitySignOut()
  activeUserId = userId
  const currentGeneration = generation

  try {
    const localUser = loadLocalActivityLedger(userId)
    const cloudUser = await loadCloudActivityLedger(userId)
    if (!isCurrent(userId, currentGeneration)) return

    const mergedUser = mergeActivityLedgers(localUser, cloudUser)
    const guestLedger = loadLocalActivityLedger(null)
    const shouldClaimGuest =
      isLedgerEmpty(localUser) &&
      isLedgerEmpty(cloudUser) &&
      !isLedgerEmpty(guestLedger) &&
      !getGuestActivityClaimedBy()
    const finalLedger = shouldClaimGuest
      ? mergeActivityLedgers(mergedUser, guestLedger)
      : mergedUser

    saveLocalActivityLedger(userId, finalLedger)
    await upsertCloudActivityEvents(userId, finalLedger.events)
    if (!isCurrent(userId, currentGeneration)) return

    if (shouldClaimGuest) setGuestActivityClaimedBy(userId)
    retryCount = 0
  } catch {
    if (isCurrent(userId, currentGeneration)) {
      pendingSync = true
      scheduleActivitySync(userId)
    }
  }
}

export function scheduleActivitySync(scheduledUserId: string): void {
  if (!activeUserId || scheduledUserId !== activeUserId) return

  clearDebounceTimer()
  const userId = scheduledUserId
  const currentGeneration = generation

  debounceTimer = setTimeout(() => {
    debounceTimer = null
    if (!isCurrent(userId, currentGeneration)) return

    if (isSyncing) {
      pendingSync = true
      return
    }

    void performActivitySync(userId, currentGeneration)
  }, SYNC_DEBOUNCE_MS)
}

async function performActivitySync(
  userId: string,
  currentGeneration: number,
): Promise<void> {
  isSyncing = true
  pendingSync = false

  try {
    const local = loadLocalActivityLedger(userId)
    const cloud = await loadCloudActivityLedger(userId)
    if (!isCurrent(userId, currentGeneration)) return

    const merged = mergeActivityLedgers(local, cloud)
    saveLocalActivityLedger(userId, merged)
    await upsertCloudActivityEvents(userId, merged.events)
    if (!isCurrent(userId, currentGeneration)) return

    retryCount = 0
  } catch {
    if (isCurrent(userId, currentGeneration) && retryCount < MAX_RETRIES) {
      retryCount += 1
      pendingSync = true
    }
  } finally {
    isSyncing = false
    if (pendingSync && isCurrent(userId, currentGeneration)) {
      scheduleActivitySync(userId)
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (activeUserId && (pendingSync || retryCount > 0)) {
      scheduleActivitySync(activeUserId)
    }
  })
}
