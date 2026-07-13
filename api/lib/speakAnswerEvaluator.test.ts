import { describe, expect, it } from "vitest"
import { normalizeEvaluation } from "./speakAnswerEvaluator"

describe("normalizeEvaluation", () => {
  it("preserves a grammar error and limits examples to two", () => {
    expect(normalizeEvaluation({
      status: "grammar_error",
      isMeaningCorrect: true,
      isGrammarCorrect: false,
      isNatural: true,
      correctedAnswer: "She goes to work every day.",
      errorPart: "go",
      explanationThai: "ประธาน She ต้องใช้ goes",
      hintThai: "ดูกริยา",
      acceptedExamples: ["She goes to work every day.", "She works every day.", "She has a job."],
    })).toEqual(expect.objectContaining({
      status: "grammar_error",
      acceptedExamples: ["She goes to work every day.", "She works every day."],
    }))
  })

  it("rejects malformed model output instead of making up a grade", () => {
    expect(() => normalizeEvaluation({ status: "maybe" })).toThrow("invalid_model_response")
  })
})
