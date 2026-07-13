import { beforeEach, describe, expect, it, vi } from "vitest"
import { loadLocalActivityLedger } from "./activityLocalStorage"
import { GUEST_INSTALLATION_ID_KEY } from "./activityKeys"
import type { LearningActivityEvent, LearningActivityInput } from "./activityTypes"

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
  getActivityIdentityScope,
  getConversationCompletionEventId,
  getLatestTimestamp,
  recordLearningActivity,
  upsertLocalEvent,
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

  it("does not allow input fields to override the generated event ID", () => {
    const runtimeInput = {
      ...input,
      id: "untrusted-event-id",
      occurredAt: "2000-01-01T00:00:00.000Z",
      localDate: "2000-01-01",
      timezoneOffsetMinutes: 0,
    } as unknown as LearningActivityInput

    const event = createLearningActivityEvent(runtimeInput, {
      eventId: "generated-event-id",
      now: new Date(2026, 6, 13, 12),
    })

    expect(event.id).toBe("generated-event-id")
    expect(event.occurredAt).not.toBe("2000-01-01T00:00:00.000Z")
    expect(event.localDate).toBe("2026-07-13")
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
    expect(syncMocks.scheduleSync).toHaveBeenCalledExactlyOnceWith("user-1")
  })

  it("schedules sync for the same User that received the local event", () => {
    syncMocks.getActiveUserId.mockReturnValue("user-1")

    recordLearningActivity(input, {
      userId: "user-explicit",
      eventId: "explicit-user-event",
      now: new Date(2026, 6, 13, 12),
    })

    expect(loadLocalActivityLedger("user-explicit").events).toHaveLength(1)
    expect(syncMocks.scheduleSync).toHaveBeenCalledExactlyOnceWith(
      "user-explicit",
    )
  })

  it("does not move ledger updatedAt backwards", () => {
    expect(
      getLatestTimestamp(
        "2026-07-13T12:00:00.000Z",
        "2026-07-12T12:00:00.000Z",
      ),
    ).toBe("2026-07-13T12:00:00.000Z")
  })

  it("replaces a duplicate ID only when the new event is newer", () => {
    const existing = createLearningActivityEvent(input, {
      eventId: "same-id",
      now: new Date("2026-07-13T05:00:00.000Z"),
    })
    const older = {
      ...existing,
      occurredAt: "2026-07-13T04:00:00.000Z",
      metadata: { correct: false },
    } satisfies LearningActivityEvent
    const newer = {
      ...existing,
      occurredAt: "2026-07-13T06:00:00.000Z",
      metadata: { correct: false },
    } satisfies LearningActivityEvent

    expect(upsertLocalEvent([existing], older)).toEqual([existing])
    expect(upsertLocalEvent([existing], newer)).toEqual([newer])
    expect(upsertLocalEvent([], existing)).toEqual([existing])
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

  it("creates different deterministic Speak IDs for different Guest installations", () => {
    const randomUuid = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000001")
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000002")

    const firstScope = getActivityIdentityScope(null)
    localStorage.removeItem(GUEST_INSTALLATION_ID_KEY)
    const secondScope = getActivityIdentityScope(null)

    expect(firstScope).not.toBe(secondScope)
    expect(
      getConversationCompletionEventId(
        firstScope,
        "conversation-1",
        "2026-07-13",
      ),
    ).not.toBe(
      getConversationCompletionEventId(
        secondScope,
        "conversation-1",
        "2026-07-13",
      ),
    )
    expect(randomUuid).toHaveBeenCalledTimes(2)
  })
})
