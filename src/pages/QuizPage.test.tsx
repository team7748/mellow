import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { QuizPage } from "./QuizPage"

describe("QuizPage", () => {
  it("renders the setup screen by default", () => {
    render(<QuizPage />)
    expect(
      screen.getByRole("heading", { name: "เลือกหมวดหมู่และประเภทแบบฝึก" }),
    ).toBeInTheDocument()
  })
})
