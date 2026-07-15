import { describe, expect, it } from "vitest"
import { evaluateGrammarAnswer } from "./practiceEngine"
import type { GrammarPracticeQuestion } from "../../types/grammar"

describe("evaluateGrammarAnswer", () => {
  const mockSentenceBuilder: GrammarPracticeQuestion = {
    id: "q2",
    type: "sentence_builder",
    instructionThai: "เรียงประโยค",
    question: "you / going / are / where ?",
    answer: "Where are you going?",
    acceptedAnswers: ["Where are you going?"],
    explanationThai: "where + are + you + going"
  };

  const mockOpenAnswer: GrammarPracticeQuestion = {
    id: "q3",
    type: "open_answer",
    instructionThai: "ตอบคำถาม",
    question: "What did you do yesterday?",
    answer: "I went to the market.",
    acceptedAnswers: ["I went to the market.", "I played football."],
    explanationThai: "ใช้ v.2"
  };

  it("handles empty answers", () => {
    const result = evaluateGrammarAnswer(mockSentenceBuilder, "   ");
    expect(result.correct).toBe(false);
    expect(result.level).toBe("incorrect");
    expect(result.errorTypes).toContain("missing_word");
  });

  it("accepts exact matches ignoring case and punctuation", () => {
    const result = evaluateGrammarAnswer(mockSentenceBuilder, "where are you going");
    expect(result.correct).toBe(true);
    expect(result.level).toBe("correct_natural");
    expect(result.errorTypes).toHaveLength(0);
  });

  it("handles different capitalization seamlessly", () => {
    const result = evaluateGrammarAnswer(mockSentenceBuilder, "wHeRe aRe YOU going");
    expect(result.correct).toBe(true);
    expect(result.level).toBe("correct_natural");
  });

  it("handles different punctuation seamlessly", () => {
    const result = evaluateGrammarAnswer(mockSentenceBuilder, "where, are... you going?!");
    expect(result.correct).toBe(true);
    expect(result.level).toBe("correct_natural");
  });

  it("expands contractions and accepts them", () => {
    const q: GrammarPracticeQuestion = {
      ...mockSentenceBuilder,
      answer: "I do not know.",
      acceptedAnswers: ["I do not know."]
    };
    const result = evaluateGrammarAnswer(q, "I don't know");
    expect(result.correct).toBe(true);
    expect(result.level).toBe("correct_natural");
  });

  it("detects spelling errors as understandable", () => {
    const q: GrammarPracticeQuestion = {
      ...mockSentenceBuilder,
      answer: "I played football",
      acceptedAnswers: ["I played football"]
    };
    const result = evaluateGrammarAnswer(q, "I plaed football"); // plaed is missing 1 char from played
    expect(result.correct).toBe(false);
    expect(result.level).toBe("understandable_with_grammar_issue");
    expect(result.errorTypes).toContain("spelling");
  });

  it("detects auxiliary missing", () => {
    const result = evaluateGrammarAnswer(mockSentenceBuilder, "Where you going?");
    expect(result.correct).toBe(false);
    expect(result.errorTypes).toContain("auxiliary");
  });

  it("detects agreement errors", () => {
    const q: GrammarPracticeQuestion = {
      ...mockSentenceBuilder,
      answer: "he goes to school",
      acceptedAnswers: ["he goes to school"]
    };
    const result = evaluateGrammarAnswer(q, "he go to school");
    expect(result.correct).toBe(false);
    expect(result.errorTypes).toContain("agreement");
  });

  it("detects verb form errors", () => {
    const q: GrammarPracticeQuestion = {
      ...mockSentenceBuilder,
      answer: "did you play",
      acceptedAnswers: ["did you play"]
    };
    const result = evaluateGrammarAnswer(q, "did you played");
    expect(result.correct).toBe(false);
    expect(result.errorTypes).toContain("verb_form");
  });

  it("detects word order errors", () => {
    const result = evaluateGrammarAnswer(mockSentenceBuilder, "you where are going?");
    expect(result.correct).toBe(false);
    expect(result.errorTypes).toContain("word_order");
  });

  it("evaluates open answers with good coverage as correct_but_improvable", () => {
    const result = evaluateGrammarAnswer(mockOpenAnswer, "went to market");
    expect(result.correct).toBe(true);
    expect(result.level).toBe("correct_but_improvable");
    expect(result.errorTypes).toContain("unnatural_expression");
  });

  it("evaluates open answers with alternate accepted answers", () => {
    const result = evaluateGrammarAnswer(mockOpenAnswer, "I PLAYED FOOTBALL");
    expect(result.correct).toBe(true);
    expect(result.level).toBe("correct_natural");
  });
});
