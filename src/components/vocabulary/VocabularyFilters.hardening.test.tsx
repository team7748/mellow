import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { VocabularyFilters } from "./VocabularyFilters"

function renderFilters() {
  return render(
    <VocabularyFilters
      searchTerm=""
      selectedCefr="all"
      selectedCategory="all"
      selectedLevel="all"
      selectedPos="all"
      selectedStatus="all"
      onCefrChange={vi.fn()}
      onCategoryChange={vi.fn()}
      onLevelChange={vi.fn()}
      onPosChange={vi.fn()}
      onSearchChange={vi.fn()}
      onStatusChange={vi.fn()}
    />,
  )
}

describe("VocabularyFilters hardening", () => {
  it("keeps category chips large and keyboard-visible", () => {
    const { container } = renderFilters()

    const categoryButtons = container.querySelectorAll("button")

    expect(categoryButtons.length).toBeGreaterThan(0)
    categoryButtons.forEach((button) => {
      expect(button).toHaveClass("min-h-11", "focus:ring-2")
    })
  })
})
