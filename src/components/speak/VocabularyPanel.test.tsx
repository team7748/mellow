import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ConversationVocab } from "../../types/conversation"
import { VocabularyPanel } from "./VocabularyPanel"

const vocab = (word: string, thaiMeaning: string, vocabNo = 1): ConversationVocab => ({
  categoryId: "daily",
  categoryTitle: "Daily",
  categoryThai: "ประจำวัน",
  vocabNo,
  word,
  thaiMeaning,
})

beforeEach(() => {
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: { cancel: vi.fn(), speak: vi.fn() },
  })
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
    configurable: true,
    value: class {
      lang = ""
      rate = 1
      pitch = 1
      volume = 1
    },
  })
})

describe("VocabularyPanel", () => {
  it("renders lesson vocabulary as rows inside one shared panel", () => {
    const { container } = render(
      <VocabularyPanel
        vocabList={[
          vocab("available", "ว่าง / พร้อม"),
          vocab("appointment", "นัดหมาย", 2),
        ]}
      />,
    )

    expect(screen.getByRole("heading", { name: "คำศัพท์ในบท" })).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    expect(screen.getByText("available")).toBeInTheDocument()
    expect(screen.getByText("ว่าง / พร้อม")).toBeInTheDocument()
    expect(container.querySelector(".surface-card")).toBeInTheDocument()
    expect(container.querySelector(".divide-y")).toBeInTheDocument()
  })

  it("keeps only the audio control interactive", () => {
    render(<VocabularyPanel vocabList={[vocab("confirm", "ยืนยัน")]} />)

    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(screen.getByRole("button", { name: "ฟังเสียง confirm" })).toBeInTheDocument()
    expect(screen.queryByText("เพิ่มคำแล้ว")).not.toBeInTheDocument()
    expect(screen.queryByText(/กดที่คำ/)).not.toBeInTheDocument()
    expect(screen.queryByText("✓")).not.toBeInTheDocument()
  })

  it("does not render when the vocabulary list is empty", () => {
    const { container } = render(<VocabularyPanel vocabList={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
