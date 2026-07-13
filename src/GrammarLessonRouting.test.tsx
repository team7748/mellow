import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"

vi.mock("./pages/GrammarLessonPage", () => ({
  GrammarLessonPage: ({ topicId }: { topicId: string }) => <h1>Grammar: {topicId}</h1>,
}))

describe("Grammar lesson hash routing", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/#grammar/topic-present-simple")
  })

  it("restores a lesson and follows later hash changes", async () => {
    render(<App />)
    expect(await screen.findByRole("heading", { name: "Grammar: topic-present-simple" })).toBeInTheDocument()

    window.location.hash = "grammar/topic-past-simple"
    expect(await screen.findByRole("heading", { name: "Grammar: topic-past-simple" })).toBeInTheDocument()
  })
})
