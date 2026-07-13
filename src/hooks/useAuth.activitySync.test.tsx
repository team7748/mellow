import { act, render, screen, waitFor } from "@testing-library/react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
  runLegacyMigration: vi.fn(),
  vocabularySignIn: vi.fn(),
  vocabularySignOut: vi.fn(),
  activitySignIn: vi.fn(),
  activitySignOut: vi.fn(),
  authCallback: undefined as
    | ((event: AuthChangeEvent, session: Session | null) => void)
    | undefined,
}))

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
    },
  },
}))

vi.mock("../lib/progress/legacyProgressMigration", () => ({
  runLegacyMigration: mocks.runLegacyMigration,
}))

vi.mock("../lib/progress/syncManager", () => ({
  handleSignIn: mocks.vocabularySignIn,
  handleSignOut: mocks.vocabularySignOut,
}))

vi.mock("../lib/activity/activitySyncManager", () => ({
  handleActivitySignIn: mocks.activitySignIn,
  handleActivitySignOut: mocks.activitySignOut,
}))

import { useAuth } from "./useAuth"

function makeSession(userId: string): Session {
  return {
    access_token: "token",
    refresh_token: "refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: { id: userId },
  } as Session
}

function AuthProbe() {
  const { user, isLoading } = useAuth()
  return <div>{isLoading ? "loading" : (user?.id ?? "guest")}</div>
}

describe("useAuth activity synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.authCallback = undefined
    mocks.vocabularySignIn.mockResolvedValue(undefined)
    mocks.activitySignIn.mockResolvedValue(undefined)
    mocks.getSession.mockResolvedValue({ data: { session: null } })
    mocks.onAuthStateChange.mockImplementation((callback) => {
      mocks.authCallback = callback
      return { data: { subscription: { unsubscribe: mocks.unsubscribe } } }
    })
  })

  it("starts vocabulary and activity synchronization for the initial User", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: makeSession("user-1") },
    })

    render(<AuthProbe />)

    expect(await screen.findByText("user-1")).toBeInTheDocument()
    expect(mocks.vocabularySignIn).toHaveBeenCalledWith("user-1")
    expect(mocks.activitySignIn).toHaveBeenCalledWith("user-1")
  })

  it("cancels both stores when Supabase signs out", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: makeSession("user-1") },
    })
    render(<AuthProbe />)
    await screen.findByText("user-1")

    act(() => mocks.authCallback?.("SIGNED_OUT", null))

    expect(await screen.findByText("guest")).toBeInTheDocument()
    expect(mocks.vocabularySignOut).toHaveBeenCalledTimes(1)
    expect(mocks.activitySignOut).toHaveBeenCalledTimes(1)
  })

  it("cancels the previous generation before synchronizing a different User", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: makeSession("user-a") },
    })
    render(<AuthProbe />)
    await screen.findByText("user-a")
    vi.clearAllMocks()

    act(() =>
      mocks.authCallback?.("SIGNED_IN", makeSession("user-b")),
    )

    expect(await screen.findByText("user-b")).toBeInTheDocument()
    expect(mocks.vocabularySignOut).toHaveBeenCalledTimes(1)
    expect(mocks.activitySignOut).toHaveBeenCalledTimes(1)
    expect(mocks.vocabularySignIn).toHaveBeenCalledWith("user-b")
    expect(mocks.activitySignIn).toHaveBeenCalledWith("user-b")
    expect(mocks.activitySignOut.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.activitySignIn.mock.invocationCallOrder[0],
    )
  })

  it("settles Auth and vocabulary sync when activity sync rejects", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: makeSession("user-1") },
    })
    mocks.activitySignIn.mockRejectedValue(new Error("activity offline"))

    render(<AuthProbe />)

    await waitFor(() => expect(screen.getByText("user-1")).toBeInTheDocument())
    expect(mocks.vocabularySignIn).toHaveBeenCalledWith("user-1")
    expect(mocks.activitySignIn).toHaveBeenCalledWith("user-1")
  })
})
