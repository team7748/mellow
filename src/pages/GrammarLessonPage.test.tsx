import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GrammarLessonPage } from "./GrammarLessonPage"

const { loadGrammarTopic } = vi.hoisted(() => ({ loadGrammarTopic: vi.fn() }))
vi.mock("../data/grammar/loader", () => ({ loadGrammarTopic }))

describe("GrammarLessonPage", () => {
  beforeEach(() => {
    localStorage.clear()
    loadGrammarTopic.mockResolvedValue({
      ok: true,
      topic: {
        id: "topic-present-simple",
        name: "Present Simple",
        nameThai: "ปัจจุบันกาลแบบธรรมดา",
        summary: { en: "Daily habits.", th: "กิจวัตรประจำวัน" },
        learningObjectives: ["Use daily-routine sentences"],
        uses: [{ id: "use-1", title: "Habits", descriptionThai: "สิ่งที่ทำเป็นประจำ", example: "I walk.", translation: "ฉันเดิน" }],
        structures: [{ id: "structure-1", type: "Affirmative", subjectGroup: "I/You", formula: "Subject + Verb 1", example: "I work.", translation: "ฉันทำงาน", noteThai: "ใช้ Verb 1" }],
        verbRules: [{ id: "rule-1", title: "Third person", ruleThai: "เติม s", examples: ["She works."] }],
        timeMarkers: [{ text: "every day", meaningThai: "ทุกวัน", example: "I study every day." }],
        examples: [{ id: "example-1", sentence: "She works every day.", translation: "เธอทำงานทุกวัน", focus: "works", usage: "habit" }],
        commonMistakes: [{ id: "mistake-1", incorrect: "She work.", correct: "She works.", explanationThai: "เติม s" }],
        comparisons: [{ id: "comparison-1", title: "vs Continuous", keyDifferenceThai: "ใช้กับกิจวัตร" }],
      },
    })
  })

  it("loads and renders lesson content from the requested topic JSON", async () => {
    render(<GrammarLessonPage topicId="topic-present-simple" onBack={vi.fn()} />)

    expect(await screen.findByRole("heading", { name: "Present Simple" })).toBeInTheDocument()
    expect(screen.getAllByText("กิจวัตรประจำวัน")).not.toHaveLength(0)
    expect(screen.getByText("She works every day.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Start Practice/i })).toBeInTheDocument()
    expect(loadGrammarTopic).toHaveBeenCalledWith("topic-present-simple")
    await waitFor(() => {
      const progress = JSON.parse(localStorage.getItem("grammar-progress-v2-guest") ?? "{}")
      expect(progress.topics["topic-present-simple"].lessonViewed).toBe(true)
      expect(progress.topics["topic-present-simple"].lessonCompleted).toBe(false)
    })
  })

  it("shows a recoverable not-found state", async () => {
    loadGrammarTopic.mockResolvedValueOnce({ ok: false, error: "topic_not_found" })
    render(<GrammarLessonPage topicId="missing-topic" onBack={vi.fn()} />)

    expect(await screen.findByText("ไม่พบบทเรียน Grammar นี้")).toBeInTheDocument()
  })

  it("stops existing speech when the lesson unmounts", async () => {
    const { unmount } = render(<GrammarLessonPage topicId="topic-present-simple" onBack={vi.fn()} />)
    await screen.findByRole("heading", { name: "Present Simple" })
    const cancel = vi.fn()
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel } })

    unmount()
    await waitFor(() => expect(cancel).toHaveBeenCalled())
  })
})
