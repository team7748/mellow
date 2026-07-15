import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_USER_PREFERENCES } from "../types/preferences"

const mocks = vi.hoisted(() => ({
  assertAuthenticatedUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
  single: vi.fn(),
}))

vi.mock("../lib/authUserScope", () => ({
  assertAuthenticatedUser: mocks.assertAuthenticatedUser,
}))

vi.mock("../lib/supabaseClient", () => ({
  supabase: { from: mocks.from },
}))

import {
  fetchUserPreferences,
  preferencesToRow,
  rowToPreferences,
  upsertUserPreferences,
} from "./preferencesService"

const row = {
  user_id: "user-1",
  daily_vocabulary_goal: 20,
  daily_practice_minutes: 30,
  reminder_enabled: true,
  reminder_time: "08:30:00",
  timezone: "Asia/Bangkok",
  language: "en" as const,
  speech_locale: "en-GB" as const,
  speech_voice_uri: "voice-1",
  speech_rate: 1.1,
  speech_auto_play: true,
  theme: "dark" as const,
}

describe("preferencesService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.from.mockReturnValue({ select: mocks.select, upsert: mocks.upsert })
    mocks.select.mockReturnValue({ eq: mocks.eq })
    mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle })
    mocks.upsert.mockReturnValue({ select: mocks.select })
  })

  it("maps between database rows and application preferences", () => {
    const preferences = rowToPreferences(row)
    expect(preferences).toMatchObject({
      dailyVocabularyGoal: 20,
      reminderTime: "08:30",
      language: "en",
      speechVoiceUri: "voice-1",
    })
    expect(preferencesToRow("user-2", preferences)).toMatchObject({
      ...row,
      user_id: "user-2",
      reminder_time: "08:30",
    })
  })

  it("loads only the authenticated user's row", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: row, error: null })
    await expect(fetchUserPreferences("user-1")).resolves.toMatchObject({
      language: "en",
    })
    expect(mocks.assertAuthenticatedUser).toHaveBeenCalledWith("user-1")
    expect(mocks.from).toHaveBeenCalledWith("user_preferences")
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-1")
  })

  it("returns defaults when no row exists", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    await expect(fetchUserPreferences("user-1")).resolves.toEqual(
      DEFAULT_USER_PREFERENCES,
    )
  })

  it("forces row ownership during upsert", async () => {
    mocks.select.mockReturnValueOnce({ single: mocks.single })
    mocks.single.mockResolvedValue({ data: { ...row, user_id: "user-2" }, error: null })

    await upsertUserPreferences("user-2", rowToPreferences(row))

    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-2" }),
      { onConflict: "user_id" },
    )
  })

  it("throws repository errors for retry handling", async () => {
    const error = new Error("offline")
    mocks.maybeSingle.mockResolvedValue({ data: null, error })
    await expect(fetchUserPreferences("user-1")).rejects.toBe(error)
  })
})
