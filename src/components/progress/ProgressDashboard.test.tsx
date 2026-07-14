import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  PROGRESS_EXPORT_FILENAME,
  PROGRESS_STORAGE_KEY,
  saveProgress,
} from "../../lib/storage"
import { getVocabularyStorageKey } from "../../lib/progress/progressKeys"
import type { UserProgress } from "../../types/vocabulary"
import { getAllVocabulary, updateWordProgress } from "../../utils/vocabulary"
import {
  calculateProgressPercentage,
  ProgressDashboard,
} from "./ProgressDashboard"

const vocabulary = getAllVocabulary()
const [firstWord, secondWord, thirdWord, fourthWord] = vocabulary

describe("calculateProgressPercentage", () => {
  it("returns 0 when there are no words", () => {
    expect(calculateProgressPercentage(0, 0)).toBe(0)
  })

  it("rounds mastered words over total words to a whole percent", () => {
    expect(calculateProgressPercentage(2250, 45)).toBe(2)
  })
})

describe("ProgressDashboard", () => {
  const validImportProgress: UserProgress = {
    learnedWordIds: [firstWord.id],
    words: {
      [firstWord.id]: {
        wordId: firstWord.id,
        status: "mastered",
        correctCount: 4,
        wrongCount: 0,
        lastStudiedAt: new Date().toISOString(),
        nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      [secondWord.id]: {
        wordId: secondWord.id,
        status: "learning",
        correctCount: 2,
        wrongCount: 1,
        lastStudiedAt: new Date().toISOString(),
        nextReviewAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
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
    updateWordProgress(firstWord.id, true, answeredAt)
    updateWordProgress(secondWord.id, false, answeredAt)
    updateWordProgress(thirdWord.id, true, answeredAt)
    updateWordProgress(thirdWord.id, true, answeredAt)
    updateWordProgress(fourthWord.id, true, answeredAt)
    updateWordProgress(fourthWord.id, true, answeredAt)
    updateWordProgress(fourthWord.id, true, answeredAt)
    updateWordProgress(fourthWord.id, true, answeredAt)

    render(<ProgressDashboard />)

    expect(
      screen.getByRole("heading", { name: "สรุปผลการเรียน" }),
    ).toBeInTheDocument()
    expect(screen.getByText(String(vocabulary.length))).toBeInTheDocument()
    expect(screen.getByText(String(vocabulary.length - 4))).toBeInTheDocument()
    expect(screen.getAllByText("2").length).toBeGreaterThan(0)
    expect(screen.getAllByText("3").length).toBeGreaterThan(0)
    expect(screen.getAllByText("1").length).toBeGreaterThan(0)
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("resets progress and refreshes counts", async () => {
    const user = userEvent.setup()
    updateWordProgress(firstWord.id, true, new Date("2026-07-07T08:00:00.000Z"))

    render(<ProgressDashboard />)

    await user.click(screen.getByRole("button", { name: "รีเซ็ตความคืบหน้า" }))

    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull()
    expect(screen.getByText("รีเซ็ตความคืบหน้าแล้ว")).toBeInTheDocument()
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

    await user.click(
      screen.getByRole("button", { name: "บันทึกไฟล์ความคืบหน้า" }),
    )

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

    await user.upload(screen.getByLabelText("นำเข้าไฟล์ความคืบหน้า"), file)

    await waitFor(() => {
      expect(screen.getByText("นำเข้าความคืบหน้าแล้ว")).toBeInTheDocument()
    })
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("rejects invalid import files without overwriting progress", async () => {
    const user = userEvent.setup()
    saveProgress(validImportProgress)
    const storageKey = getVocabularyStorageKey(null)
    const progressBeforeImport = localStorage.getItem(storageKey)

    render(<ProgressDashboard />)

    const file = new File(["{bad json"], "broken.json", {
      type: "application/json",
    })

    await user.upload(screen.getByLabelText("นำเข้าไฟล์ความคืบหน้า"), file)

    await waitFor(() => {
      expect(
        screen.getByText("ไฟล์ progress ไม่ใช่ JSON ที่อ่านได้"),
      ).toBeInTheDocument()
    })
    expect(localStorage.getItem(storageKey)).toBe(progressBeforeImport)
  })
})
