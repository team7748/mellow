import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { FlashcardPage } from "./FlashcardPage"

describe("FlashcardPage hardening", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("exposes the session progress bar to assistive technology", () => {
    render(<FlashcardPage />)

    expect(
      screen.getByRole("progressbar", {
        name: "Flashcard session progress 0%",
      }),
    ).toHaveAttribute("aria-valuenow", "0")
  })
})
