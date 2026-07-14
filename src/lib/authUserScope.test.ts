import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}))

vi.mock("./supabaseClient", () => ({
  supabase: { auth: { getUser: mocks.getUser } },
}))

import { assertAuthenticatedUser } from "./authUserScope"

describe("authenticated user scope", () => {
  beforeEach(() => vi.clearAllMocks())

  it("accepts the active user's id", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-a" } }, error: null })
    await expect(assertAuthenticatedUser("user-a")).resolves.toBeUndefined()
  })

  it("rejects a different user's id", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-a" } }, error: null })
    await expect(assertAuthenticatedUser("user-b")).rejects.toThrow(
      "does not match",
    )
  })

  it("propagates auth lookup failures", async () => {
    const error = new Error("network")
    mocks.getUser.mockResolvedValue({ data: { user: null }, error })
    await expect(assertAuthenticatedUser("user-a")).rejects.toBe(error)
  })
})
