import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { VocabularyItem } from "../../types/vocabulary"
import { FlashcardSetup } from "./FlashcardSetup"

const words = [
  {
    id: "daily-1",
    word: "breakfast",
    thaiMeaning: "อาหารเช้า",
    cefr: "A1",
    example: "Breakfast is ready.",
    category: ["Daily Life"],
  },
  {
    id: "daily-travel-1",
    word: "ticket",
    thaiMeaning: "ตั๋ว",
    cefr: "A1",
    example: "I need a ticket.",
    category: ["Daily Life", "Travel"],
  },
  {
    id: "travel-1",
    word: "hotel",
    thaiMeaning: "โรงแรม",
    cefr: "A1",
    example: "The hotel is nearby.",
    category: ["Travel"],
  },
] as VocabularyItem[]

vi.mock("../../utils/vocabulary", () => ({
  getAllVocabulary: () => words,
  getAllCategories: () => ["Daily Life", "Travel"],
  getAllPartOfSpeech: () => [],
}))

describe("FlashcardSetup category counts", () => {
  it("shows every category total and keeps it stable when another filter changes", async () => {
    const user = userEvent.setup()
    render(<FlashcardSetup onStart={vi.fn()} onBackToVocabulary={vi.fn()} />)

    expect(
      screen.getByRole("option", {
        name: "ชีวิตประจำวัน — 2 คำ",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", {
        name: "การเดินทาง — 2 คำ",
      }),
    ).toBeInTheDocument()

    await user.selectOptions(screen.getAllByRole("combobox")[1], "A2")

    expect(
      screen.getByRole("option", {
        name: "ชีวิตประจำวัน — 2 คำ",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", {
        name: "การเดินทาง — 2 คำ",
      }),
    ).toBeInTheDocument()
  })
})
