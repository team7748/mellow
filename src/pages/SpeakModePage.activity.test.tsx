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
  getScope: vi.fn(),
  getEventId: vi.fn(),
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
  getActivityIdentityScope: mocks.getScope,
  getConversationCompletionEventId: mocks.getEventId,
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
  }: {
    title: string
    onComplete: () => void
  }) => (
    <div>
      {(() => {
        mocks.completeConversation = onComplete
        return null
      })()}
      <span>{title}</span>
      <button type="button" onClick={onComplete}>
        Finish conversation
      </button>
    </div>
  ),
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
    mocks.getScope.mockReturnValue("guest:installation-1")
    mocks.getEventId.mockImplementation(
      (scope: string, conversationId: string, localDate: string) =>
        `speak:${scope}:${conversationId}:${localDate}`,
    )
  })

  it("persists the first completion before recording one event", async () => {
    const user = await openConversation()

    await user.click(
      screen.getByRole("button", { name: "Finish conversation" }),
    )

    expect(mocks.saveProgress).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        completedConversations: ["conversation-1"],
      }),
    )
    expect(mocks.recordActivity).toHaveBeenCalledTimes(1)
    expect(mocks.saveProgress.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.recordActivity.mock.invocationCallOrder[0],
    )
    expect(screen.getByText("Practice view")).toBeInTheDocument()
  })

  it("uses identity scope, conversation ID, and local date for the event ID", async () => {
    const user = await openConversation()

    await user.click(
      screen.getByRole("button", { name: "Finish conversation" }),
    )

    expect(mocks.getScope).toHaveBeenCalledTimes(1)
    expect(mocks.getEventId).toHaveBeenCalledWith(
      "guest:installation-1",
      "conversation-1",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    )
    const eventId = mocks.getEventId.mock.results[0].value
    expect(mocks.recordActivity).toHaveBeenCalledWith(
      {
        kind: "conversation_completed",
        mode: "speak",
        entityId: "conversation-1",
      },
      { eventId },
    )
  })

  it("does not persist or record a conversation completed previously", async () => {
    mocks.getProgress.mockReturnValue(progress(["conversation-1"]))
    const user = await openConversation()

    await user.click(
      screen.getByRole("button", { name: "Finish conversation" }),
    )

    expect(mocks.saveProgress).not.toHaveBeenCalled()
    expect(mocks.recordActivity).not.toHaveBeenCalled()
    expect(screen.getByText("Practice view")).toBeInTheDocument()
  })

  it("does not record when local Speak progress persistence throws", async () => {
    await openConversation()
    mocks.saveProgress.mockImplementationOnce(() => {
      throw new Error("storage full")
    })
    expect(() => mocks.completeConversation?.()).toThrow("storage full")

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
  })
})
