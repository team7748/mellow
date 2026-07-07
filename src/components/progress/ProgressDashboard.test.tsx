import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  PROGRESS_EXPORT_FILENAME,
  PROGRESS_STORAGE_KEY,
  saveProgress,
} from "../../lib/storage"
import type { UserProgress } from "../../types/vocabulary"
import { updateWordProgress } from "../../utils/vocabulary"
import {
  calculateProgressPercentage,
  ProgressDashboard,
} from "./ProgressDashboard"

describe("calculateProgressPercentage", () => {
  it("returns 0 when there are no words", () => {
    expect(calculateProgressPercentage(0, 0)).toBe(0)
  })

  it("rounds mastered words over total words to a whole percent", () => {
    expect(calculateProgressPercentage(60, 4)).toBe(7)
  })
})

describe("ProgressDashboard", () => {
  const validImportProgress: UserProgress = {
    learnedWordIds: ["word_001"],
    words: {
      word_001: {
        wordId: "word_001",
        status: "mastered",
        correctCount: 4,
        wrongCount: 0,
        lastStudiedAt: "2026-07-07T08:00:00.000Z",
        nextReviewAt: "2026-07-21T08:00:00.000Z",
      },
    },
    updatedAt: "2026-07-07T08:00:00.000Z",
  }

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("renders dashboard counts from real vocabulary progress", () => {
    const answeredAt = new Date("2026-07-01T08:00:00.000Z")
    updateWordProgress("word_001", true, answeredAt)
    updateWordProgress("word_002", false, answeredAt)
    updateWordProgress("word_003", true, answeredAt)
    updateWordProgress("word_003", true, answeredAt)
    updateWordProgress("word_004", true, answeredAt)
    updateWordProgress("word_004", true, answeredAt)
    updateWordProgress("word_004", true, answeredAt)
    updateWordProgress("word_004", true, answeredAt)

    render(<ProgressDashboard />)

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByText("60")).toBeInTheDocument()
    expect(screen.getByText("56")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2%")).toBeInTheDocument()
  })

  it("resets progress and refreshes counts", async () => {
    const user = userEvent.setup()
    updateWordProgress("word_001", true, new Date("2026-07-07T08:00:00.000Z"))

    render(<ProgressDashboard />)

    await user.click(screen.getByRole("button", { name: "Reset progress" }))

    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull()
    expect(screen.getByText("รีเซ็ต progress แล้ว")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("exports the current progress as a JSON download", async () => {
    const user = userEvent.setup()
    const clickMock = vi.fn()
    const createElement = vi.spyOn(document, "createElement")
    const createObjectUrl = vi.fn(() => "blob:progress")
    const revokeObjectUrl = vi.fn()

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrl,
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrl,
    })

    createElement.mockImplementation((tagName: string) => {
      const element = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tagName,
      )

      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          configurable: true,
          value: clickMock,
        })
      }

      return element as HTMLElement
    })

    saveProgress(validImportProgress)
    render(<ProgressDashboard />)

    await user.click(screen.getByRole("button", { name: "Export progress" }))

    const anchor = createElement.mock.results.find(
      (result) => (result.value as HTMLElement).tagName === "A",
    )?.value as HTMLAnchorElement

    expect(anchor.download).toBe(PROGRESS_EXPORT_FILENAME)
    expect(anchor.href).toBe("blob:progress")
    expect(clickMock).toHaveBeenCalledTimes(1)
    expect(createObjectUrl).toHaveBeenCalledTimes(1)
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:progress")
  })

  it("imports valid progress and refreshes dashboard counts", async () => {
    const user = userEvent.setup()
    render(<ProgressDashboard />)

    const file = new File([JSON.stringify(validImportProgress)], "progress.json", {
      type: "application/json",
    })

    await user.upload(screen.getByLabelText("Import progress"), file)

    await waitFor(() => {
      expect(screen.getByText("นำเข้า progress แล้ว")).toBeInTheDocument()
    })
    expect(screen.getByText("2%")).toBeInTheDocument()
  })

  it("rejects invalid import files without overwriting progress", async () => {
    const user = userEvent.setup()
    saveProgress(validImportProgress)

    render(<ProgressDashboard />)

    const file = new File(["{bad json"], "broken.json", {
      type: "application/json",
    })

    await user.upload(screen.getByLabelText("Import progress"), file)

    await waitFor(() => {
      expect(
        screen.getByText("ไฟล์ progress ไม่ใช่ JSON ที่อ่านได้"),
      ).toBeInTheDocument()
    })
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBe(
      JSON.stringify(validImportProgress),
    )
  })
})
