import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { QuizPage } from "./QuizPage"

describe("QuizPage Hardening", () => {
  it("renders without crashing", () => {
    render(<QuizPage />)
    expect(
      screen.getByRole("heading", { name: "เลือกหมวดหมู่และประเภทแบบฝึก" }),
    ).toBeInTheDocument()
  })
})
