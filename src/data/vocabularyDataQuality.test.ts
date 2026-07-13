import { describe, expect, it } from "vitest"
import { getAllVocabulary } from "../utils/vocabulary"

const vocabulary = getAllVocabulary()

describe("vocabulary Thai data quality", () => {
  it("loads the current full dataset with usable visible card fields", () => {
    expect(vocabulary).toHaveLength(2250)

    const firstWord = vocabulary[0]
    expect(firstWord).toMatchObject({
      id: "word_a1_0001",
      word: "actor",
      cefr: "A1",
    })
    expect(firstWord.thaiMeaning.trim()).not.toBe("")
    expect(firstWord.exampleThai.trim()).not.toBe("")
  })

  it("does not keep obvious PDF extraction spacing artifacts in Thai fields", () => {
    const thaiFields = vocabulary.flatMap((item) => [
      item.thaiMeaning,
      item.thaiReading,
      item.exampleThai,
    ]).filter((field): field is string => typeof field === "string")

    thaiFields.forEach((field) => {
      expect(field).not.toContain(" เธณ")
      expect(field).not.toContain("เธฃเธงเน")
      expect(field).not.toContain("เธเธฃเธญเน")
      expect(field).not.toContain("เธเธ“เธธ")
    })
  })
})
