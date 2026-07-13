import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { GrammarEvaluationResult } from "../data/grammar/practiceEngine"
import { createEmptyGrammarProgressV2 } from "../lib/grammarProgressStore"

const mocks = vi.hoisted(() => ({
  user: { id: "user-1" },
  loadProgress: vi.fn(),
  saveProgress: vi.fn(),
  recordActivity: vi.fn(),
}))

vi.mock("./useAuth", () => ({
  useAuth: () => ({ user: mocks.user, isLoading: false }),
}))

vi.mock("../lib/grammarProgressStore", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../lib/grammarProgressStore")
  >()
  return {
    ...actual,
    loadGrammarProgress: mocks.loadProgress,
    saveGrammarProgress: mocks.saveProgress,
  }
})

vi.mock("../lib/activity/recordLearningActivity", () => ({
  recordLearningActivity: mocks.recordActivity,
}))

import { useGrammarProgress } from "./useGrammarProgress"

const correctEvaluation: GrammarEvaluationResult = {
  correct: true,
  level: "correct_natural",
  errorTypes: [],
}

const incorrectEvaluation: GrammarEvaluationResult = {
  correct: false,
  level: "incorrect",
  errorTypes: ["tense"],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

async function renderProgressHook() {
  const view = renderHook(() => useGrammarProgress())
  await waitFor(() => expect(view.result.current.loading).toBe(false))
  return view
}

describe("useGrammarProgress learning activity", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.loadProgress.mockResolvedValue(createEmptyGrammarProgressV2())
    mocks.saveProgress.mockResolvedValue(undefined)
  })

  it("records a persisted Grammar question answer with correctness", async () => {
    const saved = deferred<void>()
    mocks.saveProgress.mockReturnValueOnce(saved.promise)
    const { result } = await renderProgressHook()

    let attempt!: Promise<void>
    act(() => {
      attempt = result.current.recordAttempt(
        "topic-1",
        "question-1",
        "I work",
        "I work",
        correctEvaluation,
      )
    })

    expect(mocks.saveProgress).toHaveBeenCalledWith(
      "user-1",
      expect.any(Object),
    )
    expect(mocks.recordActivity).not.toHaveBeenCalled()

    saved.resolve()
    await act(async () => attempt)

    expect(mocks.recordActivity).toHaveBeenCalledExactlyOnceWith({
      kind: "grammar_answer",
      mode: "grammar",
      entityId: "question-1",
      metadata: { correct: true },
    })
  })

  it("records a persisted Grammar flashcard answer", async () => {
    const { result } = await renderProgressHook()

    await act(async () => {
      await result.current.recordFlashcardAttempt(
        "topic-1",
        "pattern-1",
        false,
      )
    })

    expect(mocks.recordActivity).toHaveBeenCalledExactlyOnceWith({
      kind: "grammar_answer",
      mode: "grammar",
      entityId: "pattern-1",
      metadata: { correct: false },
    })
    expect(mocks.saveProgress.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.recordActivity.mock.invocationCallOrder[0],
    )
  })

  it("does not record an event when question progress persistence rejects", async () => {
    mocks.saveProgress.mockRejectedValueOnce(new Error("storage full"))
    const { result } = await renderProgressHook()

    await act(async () => {
      await expect(
        result.current.recordAttempt(
          "topic-1",
          "question-1",
          "worked",
          "work",
          incorrectEvaluation,
        ),
      ).rejects.toThrow("storage full")
    })

    expect(mocks.recordActivity).not.toHaveBeenCalled()
  })

  it("does not record an event when flashcard progress persistence rejects", async () => {
    mocks.saveProgress.mockRejectedValueOnce(new Error("storage full"))
    const { result } = await renderProgressHook()

    await act(async () => {
      await expect(
        result.current.recordFlashcardAttempt(
          "topic-1",
          "pattern-1",
          true,
        ),
      ).rejects.toThrow("storage full")
    })

    expect(mocks.recordActivity).not.toHaveBeenCalled()
  })

  it("builds rapid answers from the latest in-memory progress", async () => {
    const { result } = await renderProgressHook()

    await act(async () => {
      await Promise.all([
        result.current.recordAttempt(
          "topic-1",
          "question-1",
          "I work",
          "I work",
          correctEvaluation,
        ),
        result.current.recordAttempt(
          "topic-1",
          "question-2",
          "I worked",
          "I work",
          incorrectEvaluation,
        ),
      ])
    })

    const secondSavedProgress = mocks.saveProgress.mock.calls[1][1]
    expect(secondSavedProgress.topics["topic-1"]).toMatchObject({
      practiceAttempts: 2,
      questionsAnswered: 2,
      correctAnswers: 1,
    })
    expect(secondSavedProgress.questions["question-1"].attempts).toBe(1)
    expect(secondSavedProgress.questions["question-2"].attempts).toBe(1)
    expect(mocks.recordActivity).toHaveBeenCalledTimes(2)
  })

  it("records one event when React rerenders after one invocation", async () => {
    const view = await renderProgressHook()

    await act(async () => {
      await view.result.current.recordFlashcardAttempt(
        "topic-1",
        "pattern-1",
        true,
      )
    })
    view.rerender()

    expect(mocks.recordActivity).toHaveBeenCalledTimes(1)
  })
})
