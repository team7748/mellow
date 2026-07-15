import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ConversationLine } from "../../types/conversation"
import { speakText } from "../../utils/speech"
import { ConversationPlayer } from "./ConversationPlayer"

vi.mock("../../utils/speech", () => ({
  speakText: vi.fn(),
  toggleSpeech: vi.fn(),
}))

const baseLine = {
  categoryId: "category-1",
  categoryTitle: "Daily life",
  categoryThai: "ชีวิตประจำวัน",
  conversationId: "conversation-1",
  conversationNo: 1,
  conversationTitle: "At a cafe",
}

const lines: ConversationLine[] = [
  {
    ...baseLine,
    lineNo: 1,
    speaker: "A",
    english: "Hello",
    thai: "สวัสดี",
  },
  {
    ...baseLine,
    lineNo: 2,
    speaker: "B",
    english: "Welcome",
    thai: "ยินดีต้อนรับ",
  },
]

describe("ConversationPlayer completion rounds", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = vi.fn()
  })

  it("signals once per pass and again after Restart", async () => {
    const user = userEvent.setup()
    const onReachedLastLine = vi.fn()
    render(
      <ConversationPlayer
        title="At a cafe"
        lines={lines}
        onReachedLastLine={onReachedLastLine}
      />,
    )

    fireEvent.keyDown(window, { code: "ArrowRight" })
    await waitFor(() => expect(onReachedLastLine).toHaveBeenCalledTimes(1))
    expect(vi.mocked(speakText).mock.invocationCallOrder[1]).toBeLessThan(
      onReachedLastLine.mock.invocationCallOrder[0],
    )

    fireEvent.keyDown(window, { code: "ArrowLeft" })
    fireEvent.keyDown(window, { code: "ArrowRight" })
    expect(onReachedLastLine).toHaveBeenCalledTimes(1)

    const restartButton = screen
      .getAllByRole("button")
      .find((button) => button.hasAttribute("title"))
    expect(restartButton).toBeDefined()
    await user.click(restartButton as HTMLButtonElement)
    fireEvent.keyDown(window, { code: "ArrowRight" })
    await waitFor(() => expect(onReachedLastLine).toHaveBeenCalledTimes(2))
  })
})
