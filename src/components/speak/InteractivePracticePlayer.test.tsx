import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { checkSpeakAnswer } from "../../services/speakAnswerService"
import type { SpeakAnswerEvaluation } from "../../types/speakAnswerEvaluation"
import { InteractivePracticePlayer } from "./InteractivePracticePlayer"

vi.mock("../../services/speakAnswerService", () => ({
  checkSpeakAnswer: vi.fn(),
}))

const question = {
  categoryId: "morning",
  categoryTitle: "Morning",
  categoryThai: "ตอนเช้า",
  questionNo: 1,
  questionEnglish: "What time do you usually wake up?",
  questionThai: "คุณตื่นกี่โมง",
  answerExample: "I usually wake up at 7 AM.",
  usefulPhrases: "I usually...|At...",
}

const secondQuestion = {
  ...question,
  questionNo: 2,
  questionEnglish: "What do you have for breakfast?",
  questionThai: "คุณกินอะไรเป็นอาหารเช้า",
}

const evaluation = (status: SpeakAnswerEvaluation["status"]): SpeakAnswerEvaluation => ({
  status,
  isMeaningCorrect: status !== "meaning_error",
  isGrammarCorrect: status !== "grammar_error",
  isNatural: status !== "unnatural",
  correctedAnswer: "I usually wake up at 7 AM.",
  errorPart: status === "grammar_error" ? "wake" : "",
  explanationThai: "คำอธิบายภาษาไทย",
  hintThai: "คำใบ้ภาษาไทย",
  acceptedExamples: ["I usually wake up at 7 AM."],
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("InteractivePracticePlayer answer checking", () => {
  it("navigates with arrow keys and completes from the last question", () => {
    const onComplete = vi.fn()
    render(
      <InteractivePracticePlayer
        categoryTitle="Morning"
        questions={[question, secondQuestion]}
        onComplete={onComplete}
      />,
    )

    expect(screen.getByText("Question 1/2")).toBeInTheDocument()

    fireEvent.keyDown(window, { code: "ArrowRight" })
    expect(screen.getByText("Question 2/2")).toBeInTheDocument()

    fireEvent.keyDown(window, { code: "ArrowLeft" })
    expect(screen.getByText("Question 1/2")).toBeInTheDocument()

    fireEvent.keyDown(window, { code: "ArrowRight" })
    fireEvent.keyDown(window, { code: "ArrowRight" })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("shows an accessible analysis panel while the answer check is pending", async () => {
    vi.mocked(checkSpeakAnswer).mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    render(<InteractivePracticePlayer categoryTitle="Morning" questions={[question]} />)

    await user.type(screen.getByLabelText("Your Answer"), "I wake up at seven")
    await user.click(screen.getByRole("button", { name: "Check Answer" }))

    expect(screen.getByRole("status")).toHaveTextContent("กำลังวิเคราะห์คำตอบ…")
    expect(screen.getByTestId("speak-answer-loading-panel")).toBeInTheDocument()
  })

  it("locks the editor while checking and preserves the draft for Try Again", async () => {
    vi.mocked(checkSpeakAnswer).mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    render(<InteractivePracticePlayer categoryTitle="Morning" questions={[question]} />)

    const input = screen.getByLabelText("Your Answer")
    await user.type(input, "I wake up at seven")
    await user.click(screen.getByRole("button", { name: "Check Answer" }))

    expect(input).toBeDisabled()
    expect(screen.getByText("กำลังวิเคราะห์คำตอบ…")).toBeInTheDocument()
  })

  it.each([
    ["correct", "ถูกต้อง! คำตอบของคุณสื่อความหมายได้ดีและใช้ไวยากรณ์ถูกต้อง"],
    ["grammar_error", "เกือบถูกแล้ว แต่ยังมีจุดที่ต้องแก้ด้านไวยากรณ์"],
    ["meaning_error", "คำตอบยังไม่ตรงกับคำถาม ลองอ่านสถานการณ์อีกครั้ง"],
    ["unnatural", "เข้าใจได้ แต่ยังไม่เป็นธรรมชาติ"],
  ] as const)("renders Thai feedback for %s", async (status, message) => {
    vi.mocked(checkSpeakAnswer).mockResolvedValue(evaluation(status))
    const user = userEvent.setup()
    render(<InteractivePracticePlayer categoryTitle="Morning" questions={[question]} />)

    await user.type(screen.getByLabelText("Your Answer"), "I wake up at seven")
    await user.click(screen.getByRole("button", { name: "Check Answer" }))

    expect(await screen.findByText(message)).toBeInTheDocument()
  })

  it("does not call the evaluator twice while a check is pending", async () => {
    vi.mocked(checkSpeakAnswer).mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    render(<InteractivePracticePlayer categoryTitle="Morning" questions={[question]} />)

    await user.type(screen.getByLabelText("Your Answer"), "I wake up at seven")
    await user.click(screen.getByRole("button", { name: "Check Answer" }))
    await user.click(screen.getByRole("button", { name: "Checking..." }))

    expect(checkSpeakAnswer).toHaveBeenCalledTimes(1)
  })
})
