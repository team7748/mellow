import { beforeEach, describe, expect, it, vi } from "vitest"
import { loadLocalActivityLedger } from "./activityLocalStorage"

const syncMocks = vi.hoisted(() => ({
  getActiveUserId: vi.fn(),
  scheduleSync: vi.fn(),
}))

vi.mock("./activitySyncManager", () => ({
  getActiveActivityUserId: syncMocks.getActiveUserId,
  scheduleActivitySync: syncMocks.scheduleSync,
}))

import {
  createLearningActivityEvent,
  getConversationCompletionEventId,
  recordLearningActivity,
} from "./recordLearningActivity"

const input = {
  kind: "vocabulary_answer" as const,
  mode: "quiz" as const,
  entityId: "word-1",
  metadata: { correct: true, sessionId: "session-1" },
}

describe("recordLearningActivity", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    syncMocks.getActiveUserId.mockReset().mockReturnValue(null)
    syncMocks.scheduleSync.mockReset()
  })

  it("preserves a supplied event ID", () => {
    const event = createLearningActivityEvent(input, {
      eventId: "event-fixed",
      now: new Date(2026, 6, 13, 12),
    })

    expect(event.id).toBe("event-fixed")
  })

  it("uses crypto.randomUUID when an event ID is not supplied", () => {
    const randomUuid = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("00000000-0000-4000-8000-000000000001")

    const event = createLearningActivityEvent(input, {
      now: new Date(2026, 6, 13, 12),
    })

    expect(event.id).toBe("00000000-0000-4000-8000-000000000001")
    expect(randomUuid).toHaveBeenCalledTimes(1)
  })

  it("derives timestamp, local date, and offset from the same Date", () => {
    const now = new Date(2026, 6, 13, 23, 45, 30)

    const event = createLearningActivityEvent(input, {
      eventId: "event-1",
      now,
    })

    expect(event.occurredAt).toBe(now.toISOString())
    expect(event.localDate).toBe("2026-07-13")
    expect(event.timezoneOffsetMinutes).toBe(now.getTimezoneOffset())
  })

  it("writes Guest locally without scheduling cloud sync", () => {
    const event = recordLearningActivity(input, {
      userId: null,
      eventId: "guest-event",
      now: new Date(2026, 6, 13, 12),
    })

    expect(loadLocalActivityLedger(null).events).toEqual([event])
    expect(syncMocks.scheduleSync).not.toHaveBeenCalled()
  })

  it("writes the active User locally before scheduling cloud sync", () => {
    syncMocks.getActiveUserId.mockReturnValue("user-1")

    const event = recordLearningActivity(input, {
      eventId: "user-event",
      now: new Date(2026, 6, 13, 12),
    })

    expect(loadLocalActivityLedger("user-1").events).toEqual([event])
    expect(loadLocalActivityLedger(null).events).toEqual([])
    expect(syncMocks.scheduleSync).toHaveBeenCalledTimes(1)
  })

  it("deduplicates repeated deterministic IDs", () => {
    const options = {
      userId: null,
      eventId: "deterministic",
      now: new Date(2026, 6, 13, 12),
    }

    recordLearningActivity(input, options)
    recordLearningActivity(input, options)

    expect(loadLocalActivityLedger(null).events).toHaveLength(1)
  })

  it("propagates a local write failure without scheduling sync", () => {
    syncMocks.getActiveUserId.mockReturnValue("user-1")
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage full")
    })

    expect(() =>
      recordLearningActivity(input, {
        eventId: "event-1",
        now: new Date(2026, 6, 13, 12),
      }),
    ).toThrow("storage full")
    expect(syncMocks.scheduleSync).not.toHaveBeenCalled()
  })

  it("builds a stable Speak ID per scope, conversation, and local date", () => {
    const same = getConversationCompletionEventId(
      "user:1",
      "conversation/1",
      "2026-07-13",
    )

    expect(same).toBe(
      "speak:user%3A1:conversation%2F1:2026-07-13",
    )
    expect(
      getConversationCompletionEventId(
        "user:1",
        "conversation/1",
        "2026-07-13",
      ),
    ).toBe(same)
    expect(
      getConversationCompletionEventId(
        "user:1",
        "conversation/2",
        "2026-07-13",
      ),
    ).not.toBe(same)
    expect(
      getConversationCompletionEventId(
        "user:1",
        "conversation/1",
        "2026-07-14",
      ),
    ).not.toBe(same)
  })
})
