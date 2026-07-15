import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_USER_PREFERENCES } from "../types/preferences"

const mocks = vi.hoisted(() => ({
  authState: { user: null as { id: string } | null, isLoading: false },
  loadCachedPreferences: vi.fn(),
  saveCachedPreferences: vi.fn(),
  fetchUserPreferences: vi.fn(),
  upsertUserPreferences: vi.fn(),
}))

vi.mock("../hooks/useAuth", () => ({ useAuth: () => mocks.authState }))
vi.mock("../lib/preferences/preferencesStorage", () => ({
  loadCachedPreferences: mocks.loadCachedPreferences,
  saveCachedPreferences: mocks.saveCachedPreferences,
}))
vi.mock("../services/preferencesService", () => ({
  fetchUserPreferences: mocks.fetchUserPreferences,
  upsertUserPreferences: mocks.upsertUserPreferences,
}))

import { PreferencesProvider } from "./PreferencesContext"
import { usePreferences } from "../hooks/usePreferences"

function Probe() {
  const { preferences, status, updatePreferences } = usePreferences()
  return (
    <div>
      <span data-testid="theme-value">{preferences.theme}</span>
      <span>{status}</span>
      <button onClick={() => void updatePreferences({ theme: "dark" })}>dark</button>
    </div>
  )
}

describe("PreferencesProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.authState = { user: null, isLoading: false }
    mocks.loadCachedPreferences.mockReturnValue(DEFAULT_USER_PREFERENCES)
    mocks.fetchUserPreferences.mockResolvedValue(DEFAULT_USER_PREFERENCES)
    mocks.upsertUserPreferences.mockImplementation(async (_id, value) => value)
    document.documentElement.removeAttribute("data-theme")
  })

  it("saves guest settings locally without an authenticated write", async () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>)
    await userEvent.click(screen.getByRole("button", { name: "dark" }))
    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark")
    expect(mocks.saveCachedPreferences).toHaveBeenCalledWith(
      "guest",
      expect.objectContaining({ theme: "dark" }),
    )
    expect(mocks.upsertUserPreferences).not.toHaveBeenCalled()
  })

  it("reconciles an authenticated user with Supabase", async () => {
    mocks.authState = { user: { id: "user-1" }, isLoading: false }
    mocks.fetchUserPreferences.mockResolvedValue({
      ...DEFAULT_USER_PREFERENCES,
      theme: "dark",
    })
    render(<PreferencesProvider><Probe /></PreferencesProvider>)
    expect(await screen.findByTestId("theme-value")).toHaveTextContent("dark")
    expect(mocks.fetchUserPreferences).toHaveBeenCalledWith("user-1")
    expect(mocks.saveCachedPreferences).toHaveBeenCalledWith(
      "user:user-1",
      expect.objectContaining({ theme: "dark" }),
    )
  })

  it("applies the resolved theme to the root document", async () => {
    mocks.loadCachedPreferences.mockReturnValue({
      ...DEFAULT_USER_PREFERENCES,
      theme: "dark",
    })
    render(<PreferencesProvider><Probe /></PreferencesProvider>)
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"))
  })
})
