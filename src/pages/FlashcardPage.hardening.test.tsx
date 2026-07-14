import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { FlashcardPage } from "./FlashcardPage"

describe("FlashcardPage hardening", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("exposes the session progress bar to assistive technology", async () => {
    const user = userEvent.setup()
    render(<FlashcardPage />)

    await user.click(screen.getByRole("button", { name: /เริ่มฝึกทันที/ }))

    expect(
      screen.getByRole("progressbar", {
        name: "Flashcard session progress 0%",
      }),
    ).toHaveAttribute("aria-valuenow", "0")
  })
})
