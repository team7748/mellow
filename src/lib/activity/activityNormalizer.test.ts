import { describe, expect, it } from "vitest"
import {
  createEmptyActivityLedger,
  normalizeActivityLedger,
} from "./activityNormalizer"

const baseEvent = {
  id: "event-1",
  kind: "vocabulary_answer",
  mode: "flashcard",
  entityId: "word-1",
  occurredAt: "2026-07-13T08:30:00.000Z",
  localDate: "2026-07-13",
  timezoneOffsetMinutes: -420,
  metadata: {
    correct: true,
    wasDue: false,
    sessionId: "session-1",
  },
}

describe("normalizeActivityLedger", () => {
  it("keeps valid practice time and rejects invalid durations", () => {
    const valid = {
      ...baseEvent,
      id: "timed",
      kind: "practice_time",
      metadata: { sessionId: "session-1", durationSeconds: 90 },
    }
    const invalid = {
      ...valid,
      id: "invalid-timed",
      metadata: { sessionId: "session-1", durationSeconds: -1 },
    }

    expect(normalizeActivityLedger({
      version: 1,
      events: [valid, invalid],
      updatedAt: null,
    }).events).toEqual([valid])
  })

  it("keeps a valid version-one ledger and derives its latest timestamp", () => {
    expect(
      normalizeActivityLedger({
        version: 1,
        events: [baseEvent],
        updatedAt: null,
      }),
    ).toEqual({
      version: 1,
      events: [baseEvent],
      updatedAt: baseEvent.occurredAt,
    })
  })

  it("returns an empty ledger for malformed roots and unsupported versions", () => {
    expect(normalizeActivityLedger(null)).toEqual(createEmptyActivityLedger())
    expect(normalizeActivityLedger({ version: 2, events: [baseEvent] })).toEqual(
      createEmptyActivityLedger(),
    )
    expect(normalizeActivityLedger({ version: 1, events: "invalid" })).toEqual(
      createEmptyActivityLedger(),
    )
  })

  it("drops invalid events while retaining valid siblings", () => {
    const invalidEvents = [
      { ...baseEvent, id: "" },
      { ...baseEvent, kind: "page_view" },
      { ...baseEvent, mode: "navigation" },
      { ...baseEvent, entityId: " " },
      { ...baseEvent, occurredAt: "not-a-date" },
      { ...baseEvent, localDate: "2026-02-30" },
      { ...baseEvent, timezoneOffsetMinutes: -841 },
      { ...baseEvent, timezoneOffsetMinutes: 841 },
    ]

    expect(
      normalizeActivityLedger({
        version: 1,
        events: [baseEvent, ...invalidEvents],
      }).events,
    ).toEqual([baseEvent])
  })

  it("normalizes metadata to supported fields and valid primitive types", () => {
    const normalized = normalizeActivityLedger({
      version: 1,
      events: [
        {
          ...baseEvent,
          metadata: {
            correct: "yes",
            wasDue: true,
            sessionId: " ",
            injected: "discard-me",
          },
        },
      ],
    })

    expect(normalized.events[0].metadata).toEqual({ wasDue: true })
  })

  it("deduplicates by id using newer timestamps and the first exact tie", () => {
    const older = { ...baseEvent, entityId: "older" }
    const newer = {
      ...baseEvent,
      entityId: "newer",
      occurredAt: "2026-07-13T09:30:00.000Z",
    }
    const sameTimeFirst = { ...baseEvent, id: "tie", entityId: "first" }
    const sameTimeSecond = { ...baseEvent, id: "tie", entityId: "second" }

    const normalized = normalizeActivityLedger({
      version: 1,
      events: [older, newer, sameTimeFirst, sameTimeSecond],
      updatedAt: "2026-07-13T07:00:00.000Z",
    })

    expect(normalized.events).toEqual([sameTimeFirst, newer])
    expect(normalized.updatedAt).toBe(newer.occurredAt)
  })

  it("sorts events deterministically by timestamp and then id", () => {
    const later = {
      ...baseEvent,
      id: "later",
      occurredAt: "2026-07-13T10:00:00.000Z",
    }
    const sameB = { ...baseEvent, id: "b" }
    const sameA = { ...baseEvent, id: "a" }

    expect(
      normalizeActivityLedger({
        version: 1,
        events: [later, sameB, sameA],
      }).events.map((event) => event.id),
    ).toEqual(["a", "b", "later"])
  })
})
