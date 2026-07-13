import { describe, expect, it } from "vitest"
import type { LearningActivityEvent, LearningActivityLedger } from "./activityTypes"
import { mergeActivityLedgers } from "./activityMerge"

function makeEvent(
  id: string,
  occurredAt: string,
  entityId = id,
): LearningActivityEvent {
  return {
    id,
    kind: "vocabulary_answer",
    mode: "flashcard",
    entityId,
    occurredAt,
    localDate: "2026-07-13",
    timezoneOffsetMinutes: -420,
  }
}

function ledger(
  events: LearningActivityEvent[],
  updatedAt: string | null = null,
): LearningActivityLedger {
  return { version: 1, events, updatedAt }
}

describe("mergeActivityLedgers", () => {
  it("returns the normalized union of Local and Cloud IDs", () => {
    const local = ledger([makeEvent("local", "2026-07-13T08:00:00.000Z")])
    const cloud = ledger([makeEvent("cloud", "2026-07-13T09:00:00.000Z")])

    expect(mergeActivityLedgers(local, cloud).events.map((item) => item.id)).toEqual([
      "local",
      "cloud",
    ])
  })

  it("uses the newer event for a duplicate id", () => {
    const local = ledger([
      makeEvent("same", "2026-07-13T08:00:00.000Z", "local-old"),
    ])
    const cloud = ledger([
      makeEvent("same", "2026-07-13T09:00:00.000Z", "cloud-new"),
    ])

    expect(mergeActivityLedgers(local, cloud).events[0].entityId).toBe("cloud-new")
  })

  it("uses Local for an exact timestamp tie", () => {
    const timestamp = "2026-07-13T08:00:00.000Z"
    const local = ledger([makeEvent("same", timestamp, "local")])
    const cloud = ledger([makeEvent("same", timestamp, "cloud")])

    expect(mergeActivityLedgers(local, cloud).events[0].entityId).toBe("local")
  })

  it("keeps the latest ledger timestamp and does not mutate inputs", () => {
    const local = ledger(
      [makeEvent("local", "2026-07-13T08:00:00.000Z")],
      "2026-07-13T10:00:00.000Z",
    )
    const cloud = ledger(
      [makeEvent("cloud", "2026-07-13T09:00:00.000Z")],
      "2026-07-13T11:00:00.000Z",
    )
    const localBefore = structuredClone(local)
    const cloudBefore = structuredClone(cloud)

    const merged = mergeActivityLedgers(local, cloud)

    expect(merged.updatedAt).toBe("2026-07-13T11:00:00.000Z")
    expect(local).toEqual(localBefore)
    expect(cloud).toEqual(cloudBefore)
  })
})
