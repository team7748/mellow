import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  GUEST_ACTIVITY_CLAIMED_BY_KEY,
  GUEST_ACTIVITY_KEY,
  GUEST_INSTALLATION_ID_KEY,
  getActivityStorageKey,
} from "./activityKeys"
import {
  ACTIVITY_LEDGER_CHANGED_EVENT,
  getGuestActivityClaimedBy,
  getGuestInstallationId,
  loadLocalActivityLedger,
  saveLocalActivityLedger,
  setGuestActivityClaimedBy,
} from "./activityLocalStorage"

const event = {
  id: "event-1",
  kind: "vocabulary_answer" as const,
  mode: "quiz" as const,
  entityId: "word-1",
  occurredAt: "2026-07-13T05:00:00.000Z",
  localDate: "2026-07-13",
  timezoneOffsetMinutes: -420,
}

describe("activity LocalStorage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("uses isolated Guest and User keys", () => {
    expect(getActivityStorageKey(null)).toBe(GUEST_ACTIVITY_KEY)
    expect(getActivityStorageKey(undefined)).toBe(GUEST_ACTIVITY_KEY)
    expect(getActivityStorageKey("user-1")).toBe(
      "english-app:user:user-1:learning-activity",
    )
  })

  it("returns an empty ledger for missing or corrupt data", () => {
    expect(loadLocalActivityLedger(null)).toEqual({
      version: 1,
      events: [],
      updatedAt: null,
    })

    localStorage.setItem(GUEST_ACTIVITY_KEY, "not-json")
    expect(loadLocalActivityLedger(null).events).toEqual([])
  })

  it("normalizes writes and emits the affected key after saving", () => {
    const listener = vi.fn()
    window.addEventListener(ACTIVITY_LEDGER_CHANGED_EVENT, listener)

    const saved = saveLocalActivityLedger("user-1", {
      version: 1,
      events: [event, { ...event }],
      updatedAt: null,
    })

    expect(saved.events).toHaveLength(1)
    expect(loadLocalActivityLedger("user-1")).toEqual(saved)
    expect(listener).toHaveBeenCalledTimes(1)
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      storageKey: getActivityStorageKey("user-1"),
    })

    window.removeEventListener(ACTIVITY_LEDGER_CHANGED_EVENT, listener)
  })

  it("round-trips the claim marker without deleting Guest events", () => {
    saveLocalActivityLedger(null, {
      version: 1,
      events: [event],
      updatedAt: event.occurredAt,
    })

    expect(getGuestActivityClaimedBy()).toBeNull()
    setGuestActivityClaimedBy("user-1")

    expect(localStorage.getItem(GUEST_ACTIVITY_CLAIMED_BY_KEY)).toBe("user-1")
    expect(getGuestActivityClaimedBy()).toBe("user-1")
    expect(loadLocalActivityLedger(null).events).toEqual([event])
  })

  it("creates and reuses a stable Guest installation ID", () => {
    const randomUuid = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("00000000-0000-4000-8000-000000000001")

    expect(getGuestInstallationId()).toBe(
      "00000000-0000-4000-8000-000000000001",
    )
    expect(getGuestInstallationId()).toBe(
      "00000000-0000-4000-8000-000000000001",
    )
    expect(localStorage.getItem(GUEST_INSTALLATION_ID_KEY)).toBe(
      "00000000-0000-4000-8000-000000000001",
    )
    expect(randomUuid).toHaveBeenCalledTimes(1)
  })
})
