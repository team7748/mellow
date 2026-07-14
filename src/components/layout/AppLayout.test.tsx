import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAuth } from "../../hooks/useAuth"
import { AppLayout } from "./AppLayout"

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

describe("AppLayout mobile bottom navigation clearance", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ session: null, user: null, isLoading: false })
  })

  it("reserves mobile safe-area space for the bottom navigation", () => {
    const { container } = render(
      <AppLayout activePage="home" onNavigate={vi.fn()}>
        <p>Content</p>
      </AppLayout>,
    )

    expect(container.querySelector("main")).toHaveClass(
      "pb-[calc(4.5rem+env(safe-area-inset-bottom))]",
      "md:pb-8",
    )
  })
})
