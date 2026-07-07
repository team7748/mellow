import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "./App"

describe("App home page", () => {
  it("shows the progress dashboard on the home page", () => {
    render(<App />)

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByText("คำศัพท์ทั้งหมด")).toBeInTheDocument()
    expect(screen.getByText("ยังไม่เรียน")).toBeInTheDocument()
    expect(screen.getByText("กำลังเรียน")).toBeInTheDocument()
    expect(screen.getByText("ต้องทบทวน")).toBeInTheDocument()
    expect(screen.getByText("Mastered")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Export progress" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Import progress" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Reset progress" }),
    ).toBeInTheDocument()
  })

  it("opens flashcard mode from the practice navigation item", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByTitle("ฝึกจำ"))

    expect(
      screen.getByRole("heading", { name: "Flashcard Review" }),
    ).toBeInTheDocument()
  })

  it("opens quiz mode from the test navigation item", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByTitle("ทดสอบ"))

    expect(screen.getByRole("heading", { name: "Quiz Mode" })).toBeInTheDocument()
  })
})
