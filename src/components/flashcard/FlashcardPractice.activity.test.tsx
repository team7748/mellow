import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UnifiedFlashcard } from "../../types/flashcardItem"

const mocks = vi.hoisted(() => ({
  updateWordProgress: vi.fn(),
  getReviewWords: vi.fn(),
  getSrsEnabled: vi.fn(),
  getSrsRecord: vi.fn(),
  processSrsAnswer: vi.fn(),
  recordGrammarFlashcard: vi.fn(),
  recordLearningActivity: vi.fn(),
}))

vi.mock("../../utils/vocabulary", () => ({
  updateWordProgress: mocks.updateWordProgress,
  getReviewWords: mocks.getReviewWords,
}))

vi.mock("../../utils/srsService", () => ({
  getSrsEnabled: mocks.getSrsEnabled,
  getSrsRecord: mocks.getSrsRecord,
  processSrsAnswer: mocks.processSrsAnswer,
}))

vi.mock("../../hooks/useGrammarProgress", () => ({
  useGrammarProgress: () => ({
    recordFlashcardAttempt: mocks.recordGrammarFlashcard,
  }),
}))

vi.mock("../../utils/audioEffects", () => ({
  playCorrectSound: vi.fn(),
  playIncorrectSound: vi.fn(),
  playFlipSound: vi.fn(),
}))

vi.mock("../../lib/activity/recordLearningActivity", () => ({
  recordLearningActivity: mocks.recordLearningActivity,
}))

vi.mock("./SwipeableCard", () => ({
  SwipeableCard: ({ onFlip, isFlipped }: { onFlip: () => void; isFlipped: boolean }) => (
    <>
      <button type="button" onClick={onFlip}>
        test-flip
      </button>
      <span data-testid="card-side">{isFlipped ? "back" : "front"}</span>
    </>
  ),
}))

import { FlashcardPractice } from "./FlashcardPractice"

const vocabularyCard: UnifiedFlashcard = {
  id: "card-1",
  type: "vocabulary",
  front: "available",
  back: "มีอยู่",
  wordId: "word-1",
}

const grammarCard: UnifiedFlashcard = {
  id: "grammar-1",
  type: "rule",
  front: "rule",
  back: "explanation",
  topicId: "topic-1",
  patternId: "pattern-1",
}

function renderPractice(card: UnifiedFlashcard = vocabularyCard) {
  return render(
    <FlashcardPractice cards={[card]} onComplete={vi.fn()} onBack={vi.fn()} />,
  )
}

function flipAndAnswer(code: "Digit1" | "Digit3") {
  fireEvent.click(screen.getByRole("button", { name: "test-flip" }))
  fireEvent.keyDown(window, { code })
}

describe("FlashcardPractice activity events", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSrsEnabled.mockReturnValue(false)
    mocks.getReviewWords.mockReturnValue([])
    mocks.getSrsRecord.mockReturnValue(null)
    mocks.updateWordProgress.mockReturnValue({})
    mocks.processSrsAnswer.mockReturnValue({})
    mocks.recordLearningActivity.mockReturnValue({})
  })

  it("toggles the card back to the front when the card is clicked twice", () => {
    renderPractice()

    expect(screen.getByTestId("card-side")).toHaveTextContent("front")
    fireEvent.click(screen.getByRole("button", { name: "test-flip" }))
    expect(screen.getByTestId("card-side")).toHaveTextContent("back")
    fireEvent.click(screen.getByRole("button", { name: "test-flip" }))
    expect(screen.getByTestId("card-side")).toHaveTextContent("front")
  })

  it("records a correct vocabulary Flashcard after progress is saved", () => {
    mocks.getReviewWords.mockReturnValue([{ id: "word-1" }])
    const view = renderPractice()

    flipAndAnswer("Digit3")
    view.rerender(
      <FlashcardPractice
        cards={[vocabularyCard]}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />,
    )

    expect(mocks.updateWordProgress).toHaveBeenCalledWith("word-1", "known")
    expect(mocks.recordLearningActivity).toHaveBeenCalledTimes(1)
    expect(mocks.recordLearningActivity).toHaveBeenCalledWith({
      kind: "vocabulary_answer",
      mode: "flashcard",
      entityId: "word-1",
      metadata: {
        correct: true,
        wasDue: true,
        sessionId: expect.any(String),
      },
    })
    expect(mocks.getReviewWords.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.updateWordProgress.mock.invocationCallOrder[0],
    )
    expect(mocks.updateWordProgress.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.recordLearningActivity.mock.invocationCallOrder[0],
    )
  })

  it("records an incorrect normal answer with its pre-save due state", () => {
    renderPractice()
    flipAndAnswer("Digit1")

    expect(mocks.recordLearningActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ correct: false, wasDue: false }),
      }),
    )
  })

  it("reads SRS due state before saving the answer", () => {
    mocks.getSrsEnabled.mockReturnValue(true)
    mocks.getSrsRecord.mockReturnValue({
      status: "review",
      dueDate: "2020-01-01T00:00:00.000Z",
    })
    renderPractice()
    flipAndAnswer("Digit3")

    expect(mocks.processSrsAnswer).toHaveBeenCalledWith("word-1", "good")
    expect(mocks.recordLearningActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ correct: true, wasDue: true }),
      }),
    )
    expect(mocks.getSrsRecord.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.processSrsAnswer.mock.invocationCallOrder[0],
    )
  })

  it("does not record an event when vocabulary progress persistence throws", () => {
    mocks.updateWordProgress.mockImplementation(() => {
      throw new Error("progress failed")
    })
    renderPractice()

    const preventUnhandled = (event: ErrorEvent) => event.preventDefault()
    window.addEventListener("error", preventUnhandled)
    flipAndAnswer("Digit3")
    window.removeEventListener("error", preventUnhandled)

    expect(mocks.recordLearningActivity).not.toHaveBeenCalled()
  })

  it("leaves Grammar Flashcard event ownership to the Grammar hook", () => {
    renderPractice(grammarCard)
    flipAndAnswer("Digit3")

    expect(mocks.recordGrammarFlashcard).toHaveBeenCalledWith(
      "topic-1",
      "pattern-1",
      true,
    )
    expect(mocks.recordLearningActivity).not.toHaveBeenCalled()
  })
})
