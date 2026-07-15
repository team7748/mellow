import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type {
  LearningActivityEvent,
  LearningActivityLedger,
} from "../lib/activity/activityTypes"
import { toLocalDateKey } from "../lib/activity/activitySummary"
import { saveProgress } from "../lib/storage"
import { getAllVocabulary } from "../utils/vocabulary"
import { HomePage } from "./HomePage"

const mocks = vi.hoisted(() => ({
  ledger: {
    version: 1,
    events: [],
    updatedAt: null,
  } as LearningActivityLedger,
}))

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}))

vi.mock("../hooks/useProfile", () => ({
  useProfileForAuth: () => ({ profile: null }),
}))

vi.mock("../hooks/useLearningActivityLedger", () => ({
  useLearningActivityLedger: () => mocks.ledger,
}))

function activity(
  id: string,
  overrides: Partial<LearningActivityEvent> = {},
): LearningActivityEvent {
  const now = new Date()
  return {
    id,
    kind: "vocabulary_answer",
    mode: "quiz",
    entityId: `word-${id}`,
    occurredAt: now.toISOString(),
    localDate: toLocalDateKey(now),
    timezoneOffsetMinutes: now.getTimezoneOffset(),
    ...overrides,
  }
}

function setActivities(...events: LearningActivityEvent[]) {
  mocks.ledger = {
    version: 1,
    events,
    updatedAt: events.at(-1)?.occurredAt ?? null,
  }
}

function saveOneReviewWord() {
  const word = getAllVocabulary().find((item) => item.word !== "available")
  if (!word) throw new Error("Expected vocabulary data")

  saveProgress({
    learnedWordIds: [word.id],
    words: {
      [word.id]: {
        wordId: word.id,
        status: "review",
        correctCount: 2,
        wrongCount: 0,
        lastStudiedAt: new Date().toISOString(),
        nextReviewAt: "2000-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
      },
    },
    updatedAt: new Date().toISOString(),
  })

  return word
}

describe("HomePage real activity dashboard", () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, "", "/")
    setActivities()
  })

  it("renders Day streak, Daily goal, and Words learned in order from real data", async () => {
    saveOneReviewWord()
    setActivities(
      activity("quiz"),
      activity("flashcard", { mode: "flashcard" }),
      activity("speak", {
        kind: "conversation_completed",
        mode: "speak",
        entityId: "conversation-1",
      }),
    )

    const { container } = render(<HomePage />)
    const expectedLabels = [
      "วันที่เรียนต่อเนื่อง",
      "เป้าหมายรายวัน",
      "คำศัพท์ที่เรียนไป",
    ]
    const statLabels = [...container.querySelectorAll('[data-home-section="stats"] span')]
      .map((element) => element.textContent)
      .filter((label): label is string => expectedLabels.includes(label ?? ""))

    expect(statLabels).toEqual([
      "วันที่เรียนต่อเนื่อง",
      "เป้าหมายรายวัน",
      "คำศัพท์ที่เรียนไป",
    ])
    const stats = screen.getByRole("region", { name: "Learning statistics" })
    await waitFor(() => {
      expect(
        within(stats).getByText((_, element) =>
          element?.tagName === "STRONG" && element.textContent === "2/15"),
      ).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(
        screen.getByText("วันที่เรียนต่อเนื่อง").closest("div"),
      ).toHaveTextContent("1")
    })
  })

  it("renders factual Review, Flashcards, and Speak mission progress", () => {
    const reviewWord = saveOneReviewWord()
    setActivities(
      activity("review", {
        mode: "flashcard",
        entityId: reviewWord.id,
        metadata: { correct: true, wasDue: true },
      }),
      activity("flashcard", { mode: "flashcard" }),
      activity("speak", {
        kind: "conversation_completed",
        mode: "speak",
        entityId: "conversation-1",
      }),
    )

    render(<HomePage />)

    const missions = screen.getByRole("region", {
      name: "ภารกิจประจำวัน",
    })
    expect(within(missions).getByText("ทบทวนคำศัพท์")).toBeInTheDocument()
    expect(within(missions).getByText("1 / 2")).toBeInTheDocument()
    expect(within(missions).getByText("แฟลชการ์ด")).toBeInTheDocument()
    expect(within(missions).getByText("2 / 10")).toBeInTheDocument()
    expect(within(missions).getByText("ฝึกพูด")).toBeInTheDocument()
    expect(within(missions).getByText("1 / 5")).toBeInTheDocument()
    expect(
      within(missions).getByRole("progressbar", { name: "ทบทวนคำศัพท์ progress" }),
    ).toHaveAttribute("aria-valuenow", "50")
  })

  it("renders a full Speak mission after five completed rounds", () => {
    setActivities(
      ...Array.from({ length: 5 }, (_, index) =>
        activity(`speak-${index}`, {
          kind: "conversation_completed",
          mode: "speak",
          entityId: "conversation-1",
        }),
      ),
    )

    render(<HomePage />)

    const progressText = screen.getByText("5 / 5")
    const mission = progressText.closest("button")
    expect(mission).not.toBeNull()
    expect(within(mission as HTMLElement).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    )
  })

  it("hides Review when its adaptive target is zero", () => {
    render(<HomePage />)

    const missions = screen.getByRole("region", {
      name: "ภารกิจประจำวัน",
    })
    expect(within(missions).queryByText("ทบทวนคำศัพท์")).not.toBeInTheDocument()
    expect(within(missions).getByText("แฟลชการ์ด")).toBeInTheDocument()
    expect(within(missions).getByText("ฝึกพูด")).toBeInTheDocument()
  })

  it("uses existing Flashcard and Speak actions for mission items", async () => {
    const onStartFlashcard = vi.fn()
    saveOneReviewWord()
    const user = userEvent.setup()
    render(<HomePage onStartFlashcard={onStartFlashcard} />)

    await user.click(screen.getByRole("button", { name: /ทบทวนคำศัพท์ mission/ }))
    await user.click(screen.getByRole("button", { name: /แฟลชการ์ด mission/ }))
    expect(onStartFlashcard).toHaveBeenCalledTimes(1)
    expect(window.location.hash).toBe("#flashcard?filterStatus=srs-due-now&mode=reviewForgot")

    await user.click(screen.getByRole("button", { name: /ฝึกพูด mission/ }))
    expect(window.location.hash).toBe("#speak")
  })

  it("keeps the approved mobile DOM order and existing Home actions", async () => {
    saveOneReviewWord()
    const onStartFlashcard = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <HomePage onStartFlashcard={onStartFlashcard} />,
    )
    const sectionOrder = [
      ...container.querySelectorAll("[data-home-section]"),
    ].map((element) => element.getAttribute("data-home-section"))

    expect(sectionOrder).toEqual([
      "hero",
      "stats",
      "continue",
      "explore",
      "missions",
      "explore-mobile",
      "quick-review",
    ])
    expect(screen.getByRole("button", { name: "เริ่มทบทวน" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "เรียนต่อ" }))
    expect(window.location.hash).toBe("#vocabulary")
    expect(screen.queryByRole("button", { name: /notification/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /settings/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /help/i })).not.toBeInTheDocument()
  })

  it("hides Quick review when the learner has no word progress", () => {
    const { container } = render(<HomePage />)

    expect(container.querySelector('[data-home-section="quick-review"]')).toBeNull()
  })

  it("shows one mascot beside the real Quick Review button and preserves its action", async () => {
    saveOneReviewWord()
    const onStartFlashcard = vi.fn()
    const user = userEvent.setup()
    render(<HomePage onStartFlashcard={onStartFlashcard} />)

    expect(screen.getByTestId("review-sloth-mascot")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "เริ่มทบทวน" })).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "เริ่มทบทวน" }))
    await waitFor(() => expect(window.location.hash).toBe("#flashcard?filterStatus=srs-due-now&mode=reviewForgot"))
  })
})
