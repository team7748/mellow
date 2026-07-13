import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import {
  GUEST_ACTIVITY_KEY,
  getActivityStorageKey,
} from "../lib/activity/activityKeys"
import { ACTIVITY_LEDGER_CHANGED_EVENT } from "../lib/activity/activityLocalStorage"
import type {
  LearningActivityEvent,
  LearningActivityLedger,
} from "../lib/activity/activityTypes"
import { useLearningActivityLedger } from "./useLearningActivityLedger"

function event(id: string): LearningActivityEvent {
  return {
    id,
    kind: "vocabulary_answer",
    mode: "quiz",
    entityId: `word-${id}`,
    occurredAt: "2026-07-13T05:00:00.000Z",
    localDate: "2026-07-13",
    timezoneOffsetMinutes: -420,
  }
}

function ledger(...events: LearningActivityEvent[]): LearningActivityLedger {
  return {
    version: 1,
    events,
    updatedAt: events.at(-1)?.occurredAt ?? null,
  }
}

function writeLedger(userId: string | null, value: LearningActivityLedger) {
  localStorage.setItem(getActivityStorageKey(userId), JSON.stringify(value))
}

describe("useLearningActivityLedger", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("initializes from the matching Guest or User LocalStorage key", () => {
    writeLedger(null, ledger(event("guest")))
    writeLedger("user-1", ledger(event("user")))

    const guest = renderHook(() => useLearningActivityLedger(null))
    const user = renderHook(() => useLearningActivityLedger("user-1"))

    expect(guest.result.current.events.map(({ id }) => id)).toEqual(["guest"])
    expect(user.result.current.events.map(({ id }) => id)).toEqual(["user"])
  })

  it("reloads after a same-tab event for its own storage key", () => {
    const view = renderHook(() => useLearningActivityLedger("user-1"))
    writeLedger("user-1", ledger(event("new")))

    act(() => {
      window.dispatchEvent(
        new CustomEvent(ACTIVITY_LEDGER_CHANGED_EVENT, {
          detail: { storageKey: getActivityStorageKey("user-1") },
        }),
      )
    })

    expect(view.result.current.events.map(({ id }) => id)).toEqual(["new"])
  })

  it("ignores same-tab events for another User", () => {
    writeLedger("user-1", ledger(event("original")))
    const view = renderHook(() => useLearningActivityLedger("user-1"))
    writeLedger("user-1", ledger(event("changed-without-own-event")))

    act(() => {
      window.dispatchEvent(
        new CustomEvent(ACTIVITY_LEDGER_CHANGED_EVENT, {
          detail: { storageKey: getActivityStorageKey("user-2") },
        }),
      )
    })

    expect(view.result.current.events.map(({ id }) => id)).toEqual([
      "original",
    ])
  })

  it("reloads on a cross-tab storage event for its key", () => {
    const view = renderHook(() => useLearningActivityLedger(null))
    writeLedger(null, ledger(event("cross-tab")))

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: GUEST_ACTIVITY_KEY,
          storageArea: localStorage,
        }),
      )
    })

    expect(view.result.current.events.map(({ id }) => id)).toEqual([
      "cross-tab",
    ])
  })

  it("switches snapshots cleanly when the User changes", () => {
    writeLedger(null, ledger(event("guest")))
    writeLedger("user-1", ledger(event("user")))
    const view = renderHook(
      ({ userId }: { userId: string | null }) =>
        useLearningActivityLedger(userId),
      { initialProps: { userId: null as string | null } },
    )

    expect(view.result.current.events[0].id).toBe("guest")
    view.rerender({ userId: "user-1" })
    expect(view.result.current.events[0].id).toBe("user")
  })
})
