import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "./App"

describe("App home page", () => {
  it("shows the learning landing content", () => {
    render(<App />)

    expect(
      screen.getByRole("heading", { name: /จำศัพท์อังกฤษ/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /เริ่มเรียน/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/60 คำศัพท์/i)).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Flashcard" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Quiz" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Review" })).toBeInTheDocument()
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
