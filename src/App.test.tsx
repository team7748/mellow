import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"

vi.mock("./pages/FlashcardPage", () => ({
  FlashcardPage: () => <h1>ฝึกด้วย Flashcard</h1>,
}))

vi.mock("./pages/QuizPage", () => ({
  QuizPage: () => <h1>แบบทดสอบคำศัพท์</h1>,
}))

vi.mock("./pages/VocabularyPage", () => ({
  VocabularyPage: () => <h1>คลังคำศัพท์</h1>,
}))

describe("App home page", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/")
  })

  it("shows the truthful Home learning overview", async () => {
    render(<App />)

    expect(
      await screen.findByRole("heading", {
        name: "คำศัพท์ภาษาอังกฤษ",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "เรียนต่อ" }),
    ).toBeInTheDocument()
    expect(screen.getByText("คำศัพท์ที่เรียนไป")).toBeInTheDocument()
    expect(screen.getByText("เป้าหมายรายวัน")).toBeInTheDocument()
    expect(screen.getByText("วันที่เรียนต่อเนื่อง")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "ภารกิจประจำวัน" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "บันทึกไฟล์ความคืบหน้า" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "นำเข้าไฟล์ความคืบหน้า" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "รีเซ็ตความคืบหน้า" }),
    ).not.toBeInTheDocument()
  })

  it("opens flashcard mode from the practice navigation item", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole("button", { name: "ทบทวน" })[0])

    expect(
      await screen.findByRole("heading", { name: "ฝึกด้วย Flashcard" }),
    ).toBeInTheDocument()
  })

  it("opens vocabulary from the Home continue action", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "เรียนต่อ" }))

    expect(
      await screen.findByRole("heading", { name: "คลังคำศัพท์" }),
    ).toBeInTheDocument()
  })

  it("opens quiz mode from the test navigation item", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole("button", { name: "แบบฝึกหัด" })[0])

    expect(
      await screen.findByRole("heading", { name: "แบบทดสอบคำศัพท์" }),
    ).toBeInTheDocument()
  })
})
