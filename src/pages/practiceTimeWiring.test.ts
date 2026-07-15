import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const pages = [
  ["FlashcardPage.tsx", "flashcard"],
  ["QuizPage.tsx", "quiz"],
  ["GrammarLessonPage.tsx", "grammar"],
  ["SpeakModePage.tsx", "speak"],
] as const

describe("practice time page wiring", () => {
  it.each(pages)("wires %s to the %s activity mode", (file, mode) => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8")
    expect(source).toContain("usePracticeTimeTracker")
    expect(source).toContain(`mode: "${mode}"`)
    expect(source).toMatch(/enabled:/)
  })
})
