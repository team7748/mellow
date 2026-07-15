import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ recordLearningActivity: vi.fn() }))
vi.mock("../lib/activity/recordLearningActivity", () => ({
  recordLearningActivity: mocks.recordLearningActivity,
}))

import { usePracticeTimeTracker } from "./usePracticeTimeTracker"

describe("usePracticeTimeTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    })
  })

  afterEach(() => vi.useRealTimers())

  it("flushes visible active time into the existing activity ledger", () => {
    renderHook(() => usePracticeTimeTracker({
      enabled: true,
      mode: "quiz",
      entityId: "quiz-session",
    }))

    act(() => vi.advanceTimersByTime(30_000))

    expect(mocks.recordLearningActivity).toHaveBeenCalledWith({
      kind: "practice_time",
      mode: "quiz",
      entityId: "quiz-session",
      metadata: expect.objectContaining({ durationSeconds: 30 }),
    })
  })

  it("does not count time while the tab is hidden", () => {
    renderHook(() => usePracticeTimeTracker({
      enabled: true,
      mode: "grammar",
      entityId: "present-simple",
    }))
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    })
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
      vi.advanceTimersByTime(30_000)
    })
    expect(mocks.recordLearningActivity).not.toHaveBeenCalled()
  })
})
