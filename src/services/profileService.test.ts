import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  assertAuthenticatedUser: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  storageFrom: vi.fn(),
}))

vi.mock("../lib/authUserScope", () => ({
  assertAuthenticatedUser: mocks.assertAuthenticatedUser,
}))

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    storage: {
      from: mocks.storageFrom,
    },
  },
}))

import { uploadAvatar } from "./profileService"

describe("uploadAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.storageFrom.mockReturnValue({
      upload: mocks.upload,
      getPublicUrl: mocks.getPublicUrl,
    })
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "123e4567-e89b-12d3-a456-426614174000",
    )
  })

  it("uploads an authenticated user's image to their own folder", async () => {
    const file = new File(["avatar"], "renamed.txt", { type: "image/png" })
    mocks.upload.mockResolvedValue({ error: null })
    mocks.getPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.test/avatar.png" },
    })

    await expect(uploadAvatar(file, "user-1")).resolves.toBe(
      "https://example.test/avatar.png",
    )

    expect(mocks.assertAuthenticatedUser).toHaveBeenCalledWith("user-1")
    expect(mocks.storageFrom).toHaveBeenCalledWith("avatars")
    expect(mocks.upload).toHaveBeenCalledWith(
      "user-1/123e4567-e89b-12d3-a456-426614174000.png",
      file,
      {
        cacheControl: "3600",
        contentType: "image/png",
        upsert: false,
      },
    )
    expect(mocks.getPublicUrl).toHaveBeenCalledWith(
      "user-1/123e4567-e89b-12d3-a456-426614174000.png",
    )
  })

  it("does not request a public URL when the upload fails", async () => {
    mocks.upload.mockResolvedValue({ error: new Error("upload failed") })

    await expect(
      uploadAvatar(
        new File(["avatar"], "avatar.webp", { type: "image/webp" }),
        "user-1",
      ),
    ).resolves.toBeNull()

    expect(mocks.getPublicUrl).not.toHaveBeenCalled()
  })
})
