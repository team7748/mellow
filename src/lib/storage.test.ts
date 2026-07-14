import { beforeEach, describe, expect, it } from "vitest"
import type { UserProgress } from "../types/vocabulary"
import {
  importProgress,
  loadProgress,
  parseProgressImport,
  PROGRESS_EXPORT_FILENAME,
  serializeProgress,
} from "./storage"

describe("progress storage import/export helpers", () => {
  const validProgress: UserProgress = {
    learnedWordIds: ["word_001"],
    words: {
      word_001: {
        wordId: "word_001",
        status: "mastered",
        correctCount: 4,
        wrongCount: 1,
        lastStudiedAt: "2024-03-20T10:00:00.000Z",
        nextReviewAt: "2024-03-21T10:00:00.000Z",
        updatedAt: "2024-03-20T10:00:00.000Z",
      },
    },
    updatedAt: "2026-07-07T08:00:00.000Z",
  }

  beforeEach(() => {
    localStorage.clear()
  })

  it("uses the expected export filename", () => {
    expect(PROGRESS_EXPORT_FILENAME).toBe("vocabulary-progress.json")
  })

  it("serializes progress as readable JSON", () => {
    expect(serializeProgress(validProgress)).toBe(
      JSON.stringify(validProgress, null, 2),
    )
  })

  it("parses a valid imported progress object", () => {
    const result = parseProgressImport(JSON.stringify(validProgress))

    expect(result).toEqual({
      ok: true,
      progress: validProgress,
    })
  })

  it("rejects invalid JSON without returning progress", () => {
    expect(parseProgressImport("{bad json")).toEqual({
      ok: false,
      error: "ไฟล์ progress ไม่ใช่ JSON ที่อ่านได้",
    })
  })

  it("rejects malformed progress without saving", () => {
    const result = importProgress(
      JSON.stringify({
        learnedWordIds: "word_001",
        words: [],
        updatedAt: false,
      }),
    )

    expect(result).toEqual({
      ok: false,
      error: "รูปแบบไฟล์ progress ไม่ถูกต้อง",
    })
    expect(loadProgress()).toMatchObject({
      learnedWordIds: [],
      words: {},
      updatedAt: null,
    })
  })

  it("saves valid imported progress", () => {
    expect(importProgress(JSON.stringify(validProgress))).toEqual({
      ok: true,
      progress: validProgress,
    })
    expect(loadProgress()).toEqual(validProgress)
  })
})
