import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ updateUser: vi.fn() }))

vi.mock("../lib/supabaseClient", () => ({
  supabase: { auth: { updateUser: mocks.updateUser } },
}))

import { updatePassword } from "./authService"

describe("updatePassword", () => {
  beforeEach(() => vi.clearAllMocks())

  it("updates the authenticated user's password", async () => {
    mocks.updateUser.mockResolvedValue({ error: null })
    await expect(updatePassword("a-secure-password")).resolves.toEqual({ success: true })
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "a-secure-password" })
  })

  it("returns a translated error without exposing provider details", async () => {
    mocks.updateUser.mockResolvedValue({ error: { code: "weak_password" } })
    await expect(updatePassword("short")).resolves.toEqual({
      success: false,
      error: "รหัสผ่านยังไม่ปลอดภัยพอ กรุณาตั้งรหัสผ่านให้แข็งแรงขึ้น",
    })
  })
})
