import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { VocabularyItem } from "../../types/vocabulary"
import { VocabularyCard } from "./VocabularyCard"

const longWord: VocabularyItem = {
  id: "long-word",
  sourceId: "test",
  sourceScenario: "test",
  scenario: "daily",
  scenarioThai: "ทดสอบ",
  word: "extraordinarily-long-vocabulary-word",
  cefr: "B2",
  partOfSpeech: "noun",
  partOfSpeechStandard: "noun",
  ipa: "/test/",
  thaiReading: "เทสต์",
  thaiPronunciation: "เทสต์",
  thaiMeaning: "ความหมายภาษาไทยที่ยาวพอสมควรเพื่อทดสอบการตัดบรรทัด",
  simpleMeaning: "A long test word.",
  example: "This example sentence is intentionally long enough to wrap safely.",
  exampleThai: "ตัวอย่างภาษาไทย",
  contexts: {
    daily: { meaning: "", example: "", thaiExample: "" },
    work: { meaning: "", example: "", thaiExample: "" },
    study: { meaning: "", example: "", thaiExample: "" },
  },
  synonyms: [],
  commonMistake: "",
  memoryTip: "",
  allocationStatus: "Core MVP",
  memoryStatus: "New",
  nextReviewDate: "",
  reviewCount: 0,
  correctCount: 0,
  wrongCount: 0,
  category: ["School & Work"],
  level: 3,
}

describe("VocabularyCard hardening", () => {
  it("prevents long text and card actions from forcing mobile overflow", () => {
    const { container } = render(
      <VocabularyCard
        status="new"
        vocabulary={longWord}
        onViewDetails={() => undefined}
      />,
    )

    expect(container.querySelector("article")).toHaveClass("min-w-0")
    expect(container.querySelector("h2")).toHaveClass("min-w-0", "break-words")
    expect(container.querySelector("button")).toHaveClass("w-full", "max-w-full")
  })
})
