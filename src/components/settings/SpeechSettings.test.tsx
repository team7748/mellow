import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import {
  SPEECH_SETTINGS_STORAGE_KEY,
  loadSpeechSettings,
} from "../../lib/speechSettings"
import { SpeechSettings } from "./SpeechSettings"

describe("SpeechSettings", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("saves language and speed choices to LocalStorage", async () => {
    const user = userEvent.setup()
    render(<SpeechSettings />)

    expect(screen.getByRole("heading", { name: "ตั้งค่าเสียงอ่าน" })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("สำเนียงเสียงอ่าน"), "en-GB")
    await user.selectOptions(screen.getByLabelText("ความเร็วเสียงอ่าน"), "1.05")

    expect(loadSpeechSettings()).toEqual({ lang: "en-GB", rate: 1.05 })
    expect(localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY)).toBe(
      JSON.stringify({ lang: "en-GB", rate: 1.05 }),
    )
  })

  it("loads saved choices as the selected values", () => {
    localStorage.setItem(
      SPEECH_SETTINGS_STORAGE_KEY,
      JSON.stringify({ lang: "en-GB", rate: 0.75 }),
    )

    render(<SpeechSettings />)

    expect(screen.getByLabelText("สำเนียงเสียงอ่าน")).toHaveValue("en-GB")
    expect(screen.getByLabelText("ความเร็วเสียงอ่าน")).toHaveValue("0.75")
  })
})
