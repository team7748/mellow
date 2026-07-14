import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import App from "./App"

describe("App hash routing", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/")
  })

  it("syncs navigation to the URL hash", async () => {
    const user = userEvent.setup()
    render(<App />)

    const flashcardButton = document.querySelectorAll("nav button")[2]
    expect(flashcardButton).toBeInstanceOf(HTMLButtonElement)

    await user.click(flashcardButton)

    expect(window.location.hash).toBe("#flashcard")
  })

  it("opens a page from an existing hash", async () => {
    window.history.replaceState(null, "", "/#flashcard")

    render(<App />)

    expect(
      await screen.findByRole("heading", { name: "แฟลชการ์ด" }, { timeout: 8000 }),
    ).toBeInTheDocument()
  }, 10_000)
})
