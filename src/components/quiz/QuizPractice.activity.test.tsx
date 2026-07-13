import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getAllVocabulary: vi.fn(),
  recordLearningActivity: vi.fn(),
}))

vi.mock("../../utils/vocabulary", () => ({
  getAllVocabulary: mocks.getAllVocabulary,
}))

vi.mock("../../lib/activity/recordLearningActivity", () => ({
  recordLearningActivity: mocks.recordLearningActivity,
}))

vi.mock("./MultipleChoiceQuestion", () => ({
  MultipleChoiceQuestion: ({
    word,
    onAnswer,
    onSkip,
  }: {
    word: { id: string }
    onAnswer: (correct: boolean) => void
    onSkip: () => void
  }) => (
    <div>
      <span>{word.id}</span>
      <button type="button" onClick={() => onAnswer(true)}>answer-correct</button>
      <button type="button" onClick={() => onAnswer(false)}>answer-wrong</button>
      <button type="button" onClick={onSkip}>skip-question</button>
    </div>
  ),
}))

vi.mock("./FillBlankQuestion", () => ({ FillBlankQuestion: () => null }))
vi.mock("./TypingQuestion", () => ({ TypingQuestion: () => null }))

import { QuizPractice } from "./QuizPractice"

const words = [
  { id: "word-1", word: "available", thaiMeaning: "มีอยู่" },
  { id: "word-2", word: "accept", thaiMeaning: "ยอมรับ" },
]

describe("QuizPractice activity events", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAllVocabulary.mockReturnValue(words)
    mocks.recordLearningActivity.mockReturnValue({})
  })

  it.each([
    ["answer-correct", true],
    ["answer-wrong", false],
  ])("records each accepted %s Quiz answer", (buttonName, correct) => {
    const onComplete = vi.fn()
    render(
      <QuizPractice
        wordIds={["word-1"]}
        practiceType="multiple_choice"
        onComplete={onComplete}
        onBack={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: buttonName }))

    expect(mocks.recordLearningActivity).toHaveBeenCalledWith({
      kind: "vocabulary_answer",
      mode: "quiz",
      entityId: "word-1",
      metadata: { correct, sessionId: expect.any(String) },
    })
    expect(mocks.recordLearningActivity.mock.invocationCallOrder[0]).toBeLessThan(
      onComplete.mock.invocationCallOrder[0],
    )
  })

  it("does not record Skip as a learning activity", () => {
    render(
      <QuizPractice
        wordIds={["word-1"]}
        practiceType="multiple_choice"
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "skip-question" }))

    expect(mocks.recordLearningActivity).not.toHaveBeenCalled()
  })

  it("uses one stable session ID while recording distinct answers", () => {
    render(
      <QuizPractice
        wordIds={["word-1", "word-2"]}
        practiceType="multiple_choice"
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "answer-correct" }))
    fireEvent.click(screen.getByRole("button", { name: "answer-wrong" }))

    expect(mocks.recordLearningActivity).toHaveBeenCalledTimes(2)
    const firstSession = mocks.recordLearningActivity.mock.calls[0][0].metadata.sessionId
    const secondSession = mocks.recordLearningActivity.mock.calls[1][0].metadata.sessionId
    expect(firstSession).toBe(secondSession)
    expect(firstSession).toEqual(expect.any(String))
  })
})
