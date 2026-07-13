import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { VocabularyItem } from "../types/vocabulary"
import { useFlashcardSetup } from "./useFlashcardSetup"

const categoryWords = Array.from({ length: 55 }, (_, index) => ({
  id: `daily-life-${index + 1}`,
  word: `word-${index + 1}`,
  cefr: "A1",
  thaiMeaning: `ความหมาย ${index + 1}`,
  example: `Example ${index + 1}.`,
  category: ["Daily Life"],
}) as VocabularyItem)

vi.mock("../utils/vocabulary", () => ({
  getAllVocabulary: () => categoryWords,
}))

describe("useFlashcardSetup session sizes", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("starts every filtered category word outside custom selection", () => {
    const { result } = renderHook(() => useFlashcardSetup())

    act(() => result.current.updateFilter("category", "Daily Life"))

    expect(result.current.activeWords).toHaveLength(55)
    expect(result.current.startSession()).toEqual(categoryWords.map((word) => word.id))
  })

  it("keeps manually selected sessions capped at 50 words", () => {
    const { result } = renderHook(() => useFlashcardSetup())

    act(() => result.current.setMode("custom-selection"))
    act(() => result.current.selectAllCustomSelection())

    expect(result.current.customSelectedIds).toHaveLength(50)
    expect(result.current.startSession()).toHaveLength(50)
  })
})
