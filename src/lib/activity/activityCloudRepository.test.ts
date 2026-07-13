import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LearningActivityEvent } from "./activityTypes"

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock("../supabaseClient", () => ({
  supabase: { from: mocks.from },
}))

import {
  activityEventToRow,
  activityRowToEvent,
  loadCloudActivityLedger,
  upsertCloudActivityEvents,
} from "./activityCloudRepository"

const event: LearningActivityEvent = {
  id: "event-1",
  kind: "vocabulary_answer",
  mode: "flashcard",
  entityId: "word-1",
  occurredAt: "2026-07-13T08:30:00.000Z",
  localDate: "2026-07-13",
  timezoneOffsetMinutes: -420,
  metadata: { correct: true, wasDue: true, sessionId: "session-1" },
}

const row = {
  id: "event-1",
  user_id: "user-1",
  kind: "vocabulary_answer",
  mode: "flashcard",
  entity_id: "word-1",
  occurred_at: "2026-07-13T08:30:00.000Z",
  local_date: "2026-07-13",
  timezone_offset_minutes: -420,
  metadata: { correct: true, wasDue: true, sessionId: "session-1" },
}

describe("activityCloudRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.from.mockReturnValue({ select: mocks.select, upsert: mocks.upsert })
    mocks.select.mockReturnValue({ eq: mocks.eq })
  })

  it("maps events to owned database rows and maps rows back", () => {
    expect(activityEventToRow("user-1", event)).toEqual(row)
    expect(activityRowToEvent(row)).toEqual(event)
  })

  it("rejects malformed database rows", () => {
    expect(activityRowToEvent({ ...row, local_date: "invalid" })).toBeNull()
    expect(activityRowToEvent(null)).toBeNull()
  })

  it("loads only the requested user's rows and normalizes the ledger", async () => {
    mocks.eq.mockResolvedValue({ data: [row, { ...row }], error: null })

    const ledger = await loadCloudActivityLedger("user-1")

    expect(mocks.from).toHaveBeenCalledWith("learning_activity_events")
    expect(mocks.select).toHaveBeenCalledWith(
      "id,user_id,kind,mode,entity_id,occurred_at,local_date,timezone_offset_minutes,metadata",
    )
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(ledger.events).toEqual([event])
  })

  it("overwrites row ownership with the authenticated user on upsert", async () => {
    mocks.upsert.mockResolvedValue({ error: null })

    await upsertCloudActivityEvents("user-2", [event])

    expect(mocks.upsert).toHaveBeenCalledWith(
      [{ ...row, user_id: "user-2" }],
      { onConflict: "id" },
    )
  })

  it("does not issue an upsert for an empty event list", async () => {
    await upsertCloudActivityEvents("user-1", [])
    expect(mocks.from).not.toHaveBeenCalled()
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it("throws load and upsert errors so the sync manager can retry", async () => {
    const loadError = new Error("load failed")
    mocks.eq.mockResolvedValueOnce({ data: null, error: loadError })
    await expect(loadCloudActivityLedger("user-1")).rejects.toBe(loadError)

    const upsertError = new Error("upsert failed")
    mocks.upsert.mockResolvedValueOnce({ error: upsertError })
    await expect(upsertCloudActivityEvents("user-1", [event])).rejects.toBe(
      upsertError,
    )
  })
})
