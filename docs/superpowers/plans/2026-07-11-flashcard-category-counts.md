# Flashcard Category Counts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the total vocabulary count for each category in the Flashcard category selector.

**Architecture:** Keep the count display in `FlashcardSetup`, where the native category selector already lives. Build a memoized `Record<VocabCategory, number>` from the complete vocabulary dataset; use it only to render option text, while the setup hook continues to own filters and session state.

**Tech Stack:** React 19, TypeScript, Vitest, React Testing Library, Vite.

## Global Constraints

- Counts represent every word in a category and do not change with CEFR, status, search, or training-mode filters.
- Keep the existing Thai and English category labels and native `<select>` interaction.
- Do not alter session construction, manual-selection limits, or Random 20 behavior.
- Do not add dependencies.

---

### Task 1: Render stable total counts in category options

**Files:**
- Create: `src/components/flashcard/FlashcardSetup.test.tsx`
- Modify: `src/components/flashcard/FlashcardSetup.tsx:21,244-245,373-377`
- Test: `src/components/flashcard/FlashcardSetup.test.tsx`

**Interfaces:**
- Consumes: `getAllVocabulary(): VocabularyItem[]`, `getAllCategories(): VocabCategory[]`, and `getAllPartOfSpeech(): PartOfSpeech[]` from `src/utils/vocabulary.ts`.
- Produces: category option labels in the form `${CATEGORY_THAI[category]} (${category}) — ${count} คำ`.

- [ ] **Step 1: Write the failing component test**

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { VocabularyItem } from "../../types/vocabulary"
import { FlashcardSetup } from "./FlashcardSetup"

const words = [
  { id: "daily-1", word: "breakfast", thaiMeaning: "อาหารเช้า", cefr: "A1", example: "Breakfast is ready.", category: ["Daily Life"] },
  { id: "daily-travel-1", word: "ticket", thaiMeaning: "ตั๋ว", cefr: "A1", example: "I need a ticket.", category: ["Daily Life", "Travel"] },
  { id: "travel-1", word: "hotel", thaiMeaning: "โรงแรม", cefr: "A1", example: "The hotel is nearby.", category: ["Travel"] },
] as VocabularyItem[]

vi.mock("../../utils/vocabulary", () => ({
  getAllVocabulary: () => words,
  getAllCategories: () => ["Daily Life", "Travel"],
  getAllPartOfSpeech: () => [],
}))

describe("FlashcardSetup category counts", () => {
  it("shows every category's total and keeps it stable when another filter changes", async () => {
    const user = userEvent.setup()
    render(<FlashcardSetup onStart={vi.fn()} onBackToVocabulary={vi.fn()} />)

    expect(screen.getByRole("option", { name: "ชีวิตประจำวัน (Daily Life) — 2 คำ" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "การเดินทาง (Travel) — 2 คำ" })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("เลือกระดับ CEFR"), "A2")

    expect(screen.getByRole("option", { name: "ชีวิตประจำวัน (Daily Life) — 2 คำ" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "การเดินทาง (Travel) — 2 คำ" })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/flashcard/FlashcardSetup.test.tsx`

Expected: FAIL because the category options currently omit `— 2 คำ`.

- [ ] **Step 3: Implement the minimal count lookup and option label**

```tsx
import { getAllCategories, getAllPartOfSpeech, getAllVocabulary } from "../../utils/vocabulary"

const categoryWordCounts = useMemo(() => {
  const counts = {} as Record<VocabCategory, number>

  for (const word of getAllVocabulary()) {
    for (const category of word.category ?? []) {
      counts[category] = (counts[category] ?? 0) + 1
    }
  }

  return counts
}, [])

// inside the category option map
const categoryLabel = CATEGORY_THAI[cat] ? `${CATEGORY_THAI[cat]} (${cat})` : cat
return <option key={cat} value={cat}>{`${categoryLabel} — ${(categoryWordCounts[cat] ?? 0).toLocaleString()} คำ`}</option>
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- src/components/flashcard/FlashcardSetup.test.tsx`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Run Flashcard regression tests and a production build**

Run: `npm test -- src/components/flashcard/FlashcardSetup.test.tsx src/hooks/useFlashcardSetup.test.tsx src/pages/FlashcardPage.test.tsx src/pages/FlashcardPage.hardening.test.tsx`

Expected: PASS with no failing test files.

Run: `npm run build`

Expected: exit code `0` after `tsc -b && vite build`.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/components/flashcard/FlashcardSetup.tsx src/components/flashcard/FlashcardSetup.test.tsx
git commit -m "feat: show flashcard category word counts"
```
