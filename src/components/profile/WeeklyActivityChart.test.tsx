import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import type { DailyActivitySummary } from "../../lib/activity/weeklyActivitySummary"
import { WeeklyActivityChart } from "./WeeklyActivityChart"

const emptyCounts = { flashcard: 0, quiz: 0, grammar: 0, speak: 0 }
const days: DailyActivitySummary[] = Array.from({ length: 7 }, (_, index) => ({
  localDate: `2026-07-${String(index + 7).padStart(2, "0")}`,
  actionCounts: index === 6 ? { ...emptyCounts, flashcard: 2, speak: 1 } : { ...emptyCounts },
  practiceSeconds: index === 6 ? { ...emptyCounts, speak: 120 } : { ...emptyCounts },
  totalActions: index === 6 ? 3 : 0,
  totalPracticeSeconds: index === 6 ? 120 : 0,
}))

describe("WeeklyActivityChart", () => {
  it("renders seven accessible days and real selected-day details", async () => {
    render(<WeeklyActivityChart days={days} language="th" />)
    expect(screen.getAllByRole("button")).toHaveLength(7)
    await userEvent.click(screen.getAllByRole("button")[6])
    expect(screen.getByText("Flashcard 2")).toBeInTheDocument()
    expect(screen.getByText("Speak 1")).toBeInTheDocument()
    expect(screen.getByText("ฝึก 2 นาที")).toBeInTheDocument()
  })

  it("localizes the empty selected-day detail", () => {
    render(<WeeklyActivityChart days={days.slice(0, 6)} language="en" />)
    expect(screen.getByText("No activity on this day")).toBeInTheDocument()
  })
})
