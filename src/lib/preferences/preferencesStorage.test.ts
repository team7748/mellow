import { beforeEach, describe, expect, it } from "vitest"
import { DEFAULT_USER_PREFERENCES } from "../../types/preferences"
import {
  getPreferencesCacheKey,
  loadCachedPreferences,
  saveCachedPreferences,
} from "./preferencesStorage"

describe("preferencesStorage", () => {
  beforeEach(() => localStorage.clear())

  it("returns defaults for an empty scope", () => {
    expect(loadCachedPreferences("guest")).toEqual(DEFAULT_USER_PREFERENCES)
  })

  it("keeps cached settings isolated by identity scope", () => {
    saveCachedPreferences("user:one", {
      ...DEFAULT_USER_PREFERENCES,
      theme: "dark",
    })

    expect(loadCachedPreferences("user:one").theme).toBe("dark")
    expect(loadCachedPreferences("user:two").theme).toBe("system")
  })

  it("falls back safely when the cached value is malformed", () => {
    localStorage.setItem(getPreferencesCacheKey("guest"), "{broken")
    expect(loadCachedPreferences("guest")).toEqual(DEFAULT_USER_PREFERENCES)
  })

  it("migrates the legacy speech settings for a guest", () => {
    localStorage.setItem(
      "thai-english-vocab-speech-settings",
      JSON.stringify({ lang: "en-GB", rate: 1.05 }),
    )

    expect(loadCachedPreferences("guest")).toMatchObject({
      speechLocale: "en-GB",
      speechRate: 1.05,
    })
  })
})
