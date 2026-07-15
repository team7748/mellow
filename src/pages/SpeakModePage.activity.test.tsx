import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SpeakModeProgress } from "../types/conversation"

const mocks = vi.hoisted(() => ({
  fetchCategories: vi.fn(),
  fetchLines: vi.fn(),
  fetchVocab: vi.fn(),
  fetchPractice: vi.fn(),
  getProgress: vi.fn(),
  saveProgress: vi.fn(),
  recordActivity: vi.fn(),
  reachLastLine: undefined as (() => void) | undefined,
  completeConversation: undefined as (() => void) | undefined,
}))

vi.mock("../utils/conversationData", () => ({
  fetchConversationCategories: mocks.fetchCategories,
  fetchConversationLines: mocks.fetchLines,
  fetchConversationVocab: mocks.fetchVocab,
  fetchConversationPractice: mocks.fetchPractice,
  getSpeakModeProgress: mocks.getProgress,
  saveSpeakModeProgress: mocks.saveProgress,
}))

vi.mock("../lib/activity/recordLearningActivity", () => ({
  recordLearningActivity: mocks.recordActivity,
}))

vi.mock("../components/speak/CategorySelector", () => ({
  CategorySelector: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <button type="button" onClick={() => onSelect("category-1")}>
      Choose category
    </button>
  ),
}))

vi.mock("../components/speak/ConversationList", () => ({
  ConversationList: () => null,
}))

vi.mock("../components/speak/ConversationPlayer", () => ({
  ConversationPlayer: ({
    title,
    onComplete,
    onReachedLastLine,
  }: {
    title: string
    onComplete: () => void
    onReachedLastLine: () => void
  }) => {
    mocks.completeConversation = onComplete
    mocks.reachLastLine = onReachedLastLine
    return (
      <div>
        <span>{title}</span>
        <button type="button" onClick={onReachedLastLine}>
          Reach last line
        </button>
        <button type="button" onClick={onComplete}>
          Finish conversation
        </button>
      </div>
    )
  },
}))

vi.mock("../components/speak/InteractivePracticePlayer", () => ({
  InteractivePracticePlayer: () => <div>Practice view</div>,
}))

vi.mock("../components/speak/VocabularyPanel", () => ({
  VocabularyPanel: () => null,
}))

vi.mock("../components/speak/SpeakProgressCard", () => ({
  SpeakProgressCard: () => null,
}))

import { SpeakModePage } from "./SpeakModePage"

function progress(
  completedConversations: string[] = [],
): SpeakModeProgress {
  return {
    lastCategoryId: null,
    lastConversationId: null,
    lastLineNo: null,
    completedConversations,
    lastPracticedDate: null,
    practiceScores: {},
  }
}

async function openConversation() {
  const user = userEvent.setup()
  render(<SpeakModePage />)
  await user.click(
    await screen.findByRole("button", { name: "Choose category" }),
  )
  await screen.findByRole("button", { name: "Finish conversation" })
  mocks.saveProgress.mockClear()
  return user
}

describe("SpeakModePage learning activity", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.reachLastLine = undefined
    mocks.completeConversation = undefined
    window.location.hash = "#speak"
    mocks.fetchCategories.mockResolvedValue([
      {
        id: "category-1",
        title: "Daily life",
        thaiTitle: "ชีวิตประจำวัน",
        conversationCount: 1,
        lineCount: 1,
        vocabCount: 0,
        practiceCount: 0,
      },
    ])
    mocks.fetchLines.mockResolvedValue([
      {
        categoryId: "category-1",
        categoryTitle: "Daily life",
        categoryThai: "ชีวิตประจำวัน",
        conversationId: "conversation-1",
        conversationNo: 1,
        conversationTitle: "At a café",
        lineNo: 1,
        speaker: "A",
        english: "Hello",
        thai: "สวัสดี",
      },
    ])
    mocks.fetchVocab.mockResolvedValue([])
    mocks.fetchPractice.mockResolvedValue([])
    mocks.getProgress.mockReturnValue(progress())
  })

  it("persists first-time lesson state before recording the final-line event", async () => {
    const user = await openConversation()

    await user.click(
      screen.getByRole("button", { name: "Reach last line" }),
    )

    expect(mocks.saveProgress).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        completedConversations: ["conversation-1"],
      }),
    )
    expect(mocks.recordActivity).toHaveBeenCalledExactlyOnceWith({
      kind: "conversation_completed",
      mode: "speak",
      entityId: "conversation-1",
    })
    expect(mocks.saveProgress.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.recordActivity.mock.invocationCallOrder[0],
    )
  })

  it("records a repeated lesson without rewriting unique lesson state", async () => {
    mocks.getProgress.mockReturnValue(progress(["conversation-1"]))
    const user = await openConversation()

    await user.click(
      screen.getByRole("button", { name: "Reach last line" }),
    )

    expect(mocks.saveProgress).not.toHaveBeenCalled()
    expect(mocks.recordActivity).toHaveBeenCalledExactlyOnceWith({
      kind: "conversation_completed",
      mode: "speak",
      entityId: "conversation-1",
    })
  })

  it("does not record again when Finish follows the final-line event", async () => {
    const user = await openConversation()

    await user.click(
      screen.getByRole("button", { name: "Reach last line" }),
    )
    await user.click(
      screen.getByRole("button", { name: "Finish conversation" }),
    )

    expect(mocks.recordActivity).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Practice view")).toBeInTheDocument()
  })

  it("does not record when local Speak progress persistence throws", async () => {
    await openConversation()
    mocks.saveProgress.mockImplementationOnce(() => {
      throw new Error("storage full")
    })
    expect(() => mocks.reachLastLine?.()).toThrow("storage full")

    expect(mocks.recordActivity).not.toHaveBeenCalled()
  })

  it("keeps navigation to practice after completion", async () => {
    const user = await openConversation()

    await user.click(
      screen.getByRole("button", { name: "Finish conversation" }),
    )

    await waitFor(() =>
      expect(screen.getByText("Practice view")).toBeInTheDocument(),
    )
    expect(mocks.recordActivity).not.toHaveBeenCalled()
  })
})
