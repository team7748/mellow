import { beforeEach, describe, expect, it } from "vitest"
import {
  DEFAULT_SPEECH_SETTINGS,
  SPEECH_SETTINGS_STORAGE_KEY,
  loadSpeechSettings,
  saveSpeechSettings,
} from "./speechSettings"

describe("speechSettings", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns default settings when nothing is saved", () => {
    expect(loadSpeechSettings()).toEqual(DEFAULT_SPEECH_SETTINGS)
  })

  it("saves and loads valid speech settings", () => {
    saveSpeechSettings({ lang: "en-GB", rate: 1.05 })

    expect(loadSpeechSettings()).toEqual({ lang: "en-GB", rate: 1.05 })
    expect(localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY)).toBe(
      JSON.stringify({ lang: "en-GB", rate: 1.05 }),
    )
  })

  it("falls back to defaults for invalid stored settings", () => {
    localStorage.setItem(
      SPEECH_SETTINGS_STORAGE_KEY,
      JSON.stringify({ lang: "th-TH", rate: 2 }),
    )

    expect(loadSpeechSettings()).toEqual(DEFAULT_SPEECH_SETTINGS)
  })
})
