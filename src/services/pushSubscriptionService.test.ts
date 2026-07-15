import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  assertAuthenticatedUser: vi.fn(), from: vi.fn(), upsert: vi.fn(), delete: vi.fn(), eq: vi.fn(), eqEndpoint: vi.fn(),
}))

vi.mock("../lib/authUserScope", () => ({ assertAuthenticatedUser: mocks.assertAuthenticatedUser }))
vi.mock("../lib/supabaseClient", () => ({ supabase: { from: mocks.from } }))

import { deletePushSubscription, upsertPushSubscription } from "./pushSubscriptionService"

describe("pushSubscriptionService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.from.mockReturnValue({ upsert: mocks.upsert, delete: mocks.delete })
    mocks.upsert.mockResolvedValue({ error: null })
    mocks.delete.mockReturnValue({ eq: mocks.eq })
    mocks.eq.mockReturnValue({ eq: mocks.eqEndpoint })
    mocks.eqEndpoint.mockResolvedValue({ error: null })
  })

  it("forces ownership when persisting a browser subscription", async () => {
    await upsertPushSubscription("user-1", { endpoint: "https://push.test/1", p256dh: "key", auth: "secret" })
    expect(mocks.assertAuthenticatedUser).toHaveBeenCalledWith("user-1")
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1", endpoint: "https://push.test/1", auth_key: "secret" }), { onConflict: "endpoint" })
  })

  it("deletes only the authenticated user's endpoint", async () => {
    await deletePushSubscription("user-1", "https://push.test/1")
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(mocks.eqEndpoint).toHaveBeenCalledWith("endpoint", "https://push.test/1")
  })
})
