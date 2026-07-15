import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UserProfile } from "../types/profile"

const mocks = vi.hoisted(() => ({
  setProfile: vi.fn(),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
}))

const profile: UserProfile = {
  id: "user-1",
  email: "learner@example.com",
  display_name: "Mellow Learner",
  avatar_url: "https://example.test/old-avatar.png",
  role: "user",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
}

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, isLoading: false }),
}))

vi.mock("../hooks/useProfile", () => ({
  useProfile: () => ({
    profile,
    isLoading: false,
    setProfile: mocks.setProfile,
  }),
}))

vi.mock("../hooks/useLearningActivityLedger", () => ({
  useLearningActivityLedger: () => ({
    version: 1,
    events: [],
    updatedAt: null,
  }),
}))

vi.mock("../hooks/useGrammarProgress", () => ({
  useGrammarProgress: () => ({ progress: { topics: {} } }),
}))

vi.mock("../hooks/usePreferences", () => ({
  usePreferences: () => ({
    preferences: {
      dailyVocabularyGoal: 10,
      dailyPracticeMinutes: 15,
      language: "th",
    },
  }),
}))

vi.mock("../contexts/I18nContext", () => ({
  useI18n: () => ({
    t: (key: string) => ({
      "profile.title": "โปรไฟล์",
      "profile.weeklyActivity": "กิจกรรมย้อนหลัง 7 วัน",
    })[key] ?? key,
  }),
}))

vi.mock("../lib/storage", () => ({
  loadProgress: () => ({ learnedWordIds: [] }),
}))

vi.mock("../services/profileService", () => ({
  AVATAR_MAX_BYTES: 5 * 1024 * 1024,
  AVATAR_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],
  updateProfile: mocks.updateProfile,
  uploadAvatar: mocks.uploadAvatar,
}))

vi.mock("../services/authService", () => ({ logout: vi.fn() }))

import { ProfilePage } from "./ProfilePage"

function getAvatarInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error("Avatar input was not rendered")
  return input
}

describe("ProfilePage avatar upload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    [
      "unsupported type",
      new File(["avatar"], "avatar.gif", { type: "image/gif" }),
      "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP",
    ],
    [
      "oversized file",
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "avatar.png", {
        type: "image/png",
      }),
      "รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB",
    ],
  ])("rejects an %s before uploading", async (_case, file, message) => {
    const { container } = render(<ProfilePage />)

    fireEvent.change(getAvatarInput(container), { target: { files: [file] } })

    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    expect(mocks.uploadAvatar).not.toHaveBeenCalled()
    expect(mocks.updateProfile).not.toHaveBeenCalled()
  })

  it("keeps the current avatar and reports an upload failure", async () => {
    mocks.uploadAvatar.mockResolvedValue(null)
    const { container } = render(<ProfilePage />)

    fireEvent.change(getAvatarInput(container), {
      target: {
        files: [new File(["avatar"], "avatar.png", { type: "image/png" })],
      },
    })

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    )
    expect(screen.getByRole("img", { name: "รูปโปรไฟล์ของ Mellow Learner" })).toHaveAttribute(
      "src",
      profile.avatar_url,
    )
    expect(mocks.updateProfile).not.toHaveBeenCalled()
    expect(mocks.setProfile).not.toHaveBeenCalled()
  })

  it("stores the new URL and updates the displayed profile", async () => {
    const newUrl = "https://example.test/new-avatar.png"
    mocks.uploadAvatar.mockResolvedValue(newUrl)
    mocks.updateProfile.mockResolvedValue(true)
    const { container } = render(<ProfilePage />)

    fireEvent.change(getAvatarInput(container), {
      target: {
        files: [new File(["avatar"], "avatar.png", { type: "image/png" })],
      },
    })

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith("user-1", {
        avatar_url: newUrl,
      })
    })
    expect(mocks.setProfile).toHaveBeenCalledWith({
      ...profile,
      avatar_url: newUrl,
    })
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
