import { beforeEach, describe, expect, it } from "vitest"
import {
  clearPracticeSession,
  loadPracticeSession,
  savePracticeSession,
} from "./practiceSessionStorage"

describe("practiceSessionStorage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("saves and restores an active practice session", () => {
    const state = { currentIndex: 3, answeredIds: ["word-1", "word-2"] }

    savePracticeSession("test-practice", state)

    expect(loadPracticeSession<typeof state>("test-practice")).toEqual(state)
  })

  it("returns null for invalid stored data", () => {
    localStorage.setItem("test-practice", "not-json")

    expect(loadPracticeSession("test-practice")).toBeNull()
  })

  it("clears a completed practice session", () => {
    savePracticeSession("test-practice", { currentIndex: 1 })

    clearPracticeSession("test-practice")

    expect(loadPracticeSession("test-practice")).toBeNull()
  })
})
