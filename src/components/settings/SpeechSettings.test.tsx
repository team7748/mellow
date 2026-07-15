import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SpeechSettings } from "./SpeechSettings"

const updatePreferences = vi.fn().mockResolvedValue(true)

vi.mock("../../hooks/usePreferences", () => ({
  usePreferences: () => ({
    preferences: { speechLocale: "en-GB", speechRate: 0.75 },
    updatePreferences,
  }),
}))

describe("SpeechSettings", () => {
  beforeEach(() => updatePreferences.mockClear())

  it("loads and saves choices through the shared preferences system", async () => {
    const user = userEvent.setup()
    render(<SpeechSettings />)

    expect(screen.getByLabelText("สำเนียงเสียงอ่าน")).toHaveValue("en-GB")
    expect(screen.getByLabelText("ความเร็วเสียงอ่าน")).toHaveValue("0.75")

    await user.selectOptions(screen.getByLabelText("สำเนียงเสียงอ่าน"), "en-US")
    await user.selectOptions(screen.getByLabelText("ความเร็วเสียงอ่าน"), "1.25")

    expect(updatePreferences).toHaveBeenCalledWith({ speechLocale: "en-US" })
    expect(updatePreferences).toHaveBeenCalledWith({ speechRate: 1.25 })
  })
})
