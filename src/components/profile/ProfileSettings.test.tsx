import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_USER_PREFERENCES } from "../../types/preferences"
import { ProfileSettings } from "./ProfileSettings"

const updatePreferences = vi.fn().mockResolvedValue(true)

vi.mock("../../hooks/usePreferences", () => ({
  usePreferences: () => ({
    preferences: DEFAULT_USER_PREFERENCES,
    status: "ready",
    error: null,
    updatePreferences,
  }),
}))

describe("ProfileSettings", () => {
  beforeEach(() => updatePreferences.mockClear())

  it("saves daily vocabulary and practice-time goals", async () => {
    const user = userEvent.setup()
    render(<ProfileSettings />)

    await user.click(screen.getByRole("button", { name: /เป้าหมายการเรียน/ }))
    await user.clear(screen.getByLabelText("เป้าหมายคำศัพท์ต่อวัน"))
    await user.type(screen.getByLabelText("เป้าหมายคำศัพท์ต่อวัน"), "25")
    await user.clear(screen.getByLabelText("เวลาฝึกต่อวัน (นาที)"))
    await user.type(screen.getByLabelText("เวลาฝึกต่อวัน (นาที)"), "30")
    await user.click(screen.getByRole("button", { name: "บันทึกเป้าหมาย" }))

    expect(updatePreferences).toHaveBeenCalledWith({
      dailyVocabularyGoal: 25,
      dailyPracticeMinutes: 30,
    })
  })

  it("applies language, theme, and speech preferences", async () => {
    const user = userEvent.setup()
    render(<ProfileSettings />)

    await user.selectOptions(screen.getByLabelText("ภาษาแอป"), "en")
    await user.selectOptions(screen.getByLabelText("ธีมการแสดงผล"), "dark")
    await user.selectOptions(screen.getByLabelText("สำเนียงเสียงอ่าน"), "en-GB")
    await user.selectOptions(screen.getByLabelText("ความเร็วเสียงอ่าน"), "1.25")
    await user.click(screen.getByRole("checkbox", { name: "เล่นเสียงอัตโนมัติ" }))

    expect(updatePreferences).toHaveBeenCalledWith({ language: "en" })
    expect(updatePreferences).toHaveBeenCalledWith({ theme: "dark" })
    expect(updatePreferences).toHaveBeenCalledWith({
      speechLocale: "en-GB",
      speechVoiceUri: null,
    })
    expect(updatePreferences).toHaveBeenCalledWith({ speechRate: 1.25 })
    expect(updatePreferences).toHaveBeenCalledWith({ speechAutoPlay: false })
  })

  it("opens the existing personal profile editor", async () => {
    const user = userEvent.setup()
    const onEditPersonalData = vi.fn()
    render(<ProfileSettings onEditPersonalData={onEditPersonalData} />)

    await user.click(screen.getByRole("button", { name: /จัดการข้อมูลส่วนตัว/ }))
    expect(onEditPersonalData).toHaveBeenCalledTimes(1)
  })
})
