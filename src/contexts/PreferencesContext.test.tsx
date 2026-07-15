import { act, render, screen, waitFor } from "@testing-library/react"
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
      <span data-testid="language-value">{preferences.language}</span>
      <span data-testid="rate-value">{preferences.speechRate}</span>
      <span>{status}</span>
      <button onClick={() => void updatePreferences({ language: "en" })}>English</button>
      <button onClick={() => void updatePreferences({ speechRate: 1.25 })}>Faster</button>
    </div>
  )
}

describe("PreferencesProvider", () => {
  function deferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise
      reject = rejectPromise
    })
    return { promise, resolve, reject }
  }

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
    await userEvent.click(screen.getByRole("button", { name: "English" }))
    expect(screen.getByTestId("language-value")).toHaveTextContent("en")
    expect(mocks.saveCachedPreferences).toHaveBeenCalledWith(
      "guest",
      expect.objectContaining({ language: "en" }),
    )
    expect(mocks.upsertUserPreferences).not.toHaveBeenCalled()
  })

  it("reconciles an authenticated user with Supabase", async () => {
    mocks.authState = { user: { id: "user-1" }, isLoading: false }
    mocks.fetchUserPreferences.mockResolvedValue({
      ...DEFAULT_USER_PREFERENCES,
      language: "en",
    })
    render(<PreferencesProvider><Probe /></PreferencesProvider>)
    expect(await screen.findByTestId("language-value")).toHaveTextContent("en")
    expect(mocks.fetchUserPreferences).toHaveBeenCalledWith("user-1")
    expect(mocks.saveCachedPreferences).toHaveBeenCalledWith(
      "user:user-1",
      expect.objectContaining({ language: "en" }),
    )
  })

  it("forces light color scheme without a runtime theme attribute", async () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>)
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBeUndefined()
      expect(document.documentElement.style.colorScheme).toBe("light")
    })
  })

  it("serializes rapid authenticated updates without losing fields", async () => {
    const firstSave = deferred<typeof DEFAULT_USER_PREFERENCES>()
    const secondSave = deferred<typeof DEFAULT_USER_PREFERENCES>()
    mocks.authState = { user: { id: "user-1" }, isLoading: false }
    mocks.upsertUserPreferences
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => secondSave.promise)

    render(<PreferencesProvider><Probe /></PreferencesProvider>)
    await screen.findByText("ready")
    await userEvent.click(screen.getByRole("button", { name: "English" }))
    await userEvent.click(screen.getByRole("button", { name: "Faster" }))

    expect(mocks.upsertUserPreferences).toHaveBeenCalledTimes(1)
    const firstPreferences = mocks.upsertUserPreferences.mock.calls[0][1]

    await act(async () => firstSave.resolve(firstPreferences))
    await waitFor(() => expect(mocks.upsertUserPreferences).toHaveBeenCalledTimes(2))
    const secondPreferences = mocks.upsertUserPreferences.mock.calls[1][1]
    expect(secondPreferences).toEqual(expect.objectContaining({
      language: "en",
      speechRate: 1.25,
    }))

    await act(async () => secondSave.resolve(secondPreferences))
    await waitFor(() => {
      expect(screen.getByTestId("language-value")).toHaveTextContent("en")
      expect(screen.getByTestId("rate-value")).toHaveTextContent("1.25")
    })
  })

  it("ignores a completed save after the authenticated scope logs out", async () => {
    const save = deferred<typeof DEFAULT_USER_PREFERENCES>()
    mocks.authState = { user: { id: "user-1" }, isLoading: false }
    mocks.upsertUserPreferences.mockImplementationOnce(() => save.promise)

    const view = render(<PreferencesProvider><Probe /></PreferencesProvider>)
    await screen.findByText("ready")
    await userEvent.click(screen.getByRole("button", { name: "English" }))

    mocks.authState = { user: null, isLoading: false }
    view.rerender(<PreferencesProvider><Probe /></PreferencesProvider>)
    await waitFor(() => expect(screen.getByTestId("language-value")).toHaveTextContent("th"))

    const savedPreferences = mocks.upsertUserPreferences.mock.calls[0][1]
    await act(async () => save.resolve(savedPreferences))
    await waitFor(() => expect(screen.getByTestId("language-value")).toHaveTextContent("th"))
    expect(mocks.saveCachedPreferences).not.toHaveBeenCalledWith(
      "guest",
      expect.objectContaining({ language: "en" }),
    )
  })

  it("does not let the initial remote fetch overwrite a newer user update", async () => {
    const initialFetch = deferred<typeof DEFAULT_USER_PREFERENCES>()
    mocks.authState = { user: { id: "user-1" }, isLoading: false }
    mocks.fetchUserPreferences.mockImplementationOnce(() => initialFetch.promise)
    mocks.upsertUserPreferences.mockImplementationOnce(async (_id, value) => value)

    render(<PreferencesProvider><Probe /></PreferencesProvider>)
    await screen.findByText("loading")
    await userEvent.click(screen.getByRole("button", { name: "English" }))
    await waitFor(() => expect(screen.getByTestId("language-value")).toHaveTextContent("en"))

    await act(async () => initialFetch.resolve(DEFAULT_USER_PREFERENCES))
    await waitFor(() => expect(screen.getByTestId("language-value")).toHaveTextContent("en"))
  })
})
