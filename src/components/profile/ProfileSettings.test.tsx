import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ProfileSettings } from "./ProfileSettings"

const mocks = vi.hoisted(() => ({
  updatePreferences: vi.fn().mockResolvedValue(true),
  enablePushNotifications: vi.fn().mockResolvedValue({}),
  disablePushNotifications: vi.fn().mockResolvedValue(undefined),
  preferences: {
    dailyVocabularyGoal: 10, dailyPracticeMinutes: 15,
    reminderEnabled: false, reminderTime: "19:00", timezone: "Asia/Bangkok",
    language: "th", speechLocale: "en-US", speechVoiceUri: null,
    speechRate: 1, speechAutoPlay: true,
  },
  pushCapability: { supported: true, configured: true, permission: "default" },
}))

vi.mock("../../hooks/usePreferences", () => ({
  usePreferences: () => ({
    preferences: mocks.preferences,
    status: "ready",
    error: null,
    updatePreferences: mocks.updatePreferences,
  }),
}))

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}))

vi.mock("../../lib/notifications/pushNotifications", () => ({
  getPushCapability: () => mocks.pushCapability,
  enablePushNotifications: mocks.enablePushNotifications,
  disablePushNotifications: mocks.disablePushNotifications,
}))

describe("ProfileSettings", () => {
  beforeEach(() => {
    mocks.updatePreferences.mockReset().mockResolvedValue(true)
    mocks.enablePushNotifications.mockReset().mockResolvedValue({})
    mocks.disablePushNotifications.mockReset().mockResolvedValue(undefined)
    Object.assign(mocks.preferences, {
      reminderEnabled: false,
      reminderTime: "19:00",
    })
    Object.assign(mocks.pushCapability, {
      supported: true,
      configured: true,
      permission: "default",
    })
  })

  it("saves daily vocabulary and practice-time goals", async () => {
    const user = userEvent.setup()
    render(<ProfileSettings />)

    await user.click(screen.getByRole("button", { name: /เป้าหมายการเรียน/ }))
    await user.clear(screen.getByLabelText("เป้าหมายคำศัพท์ต่อวัน"))
    await user.type(screen.getByLabelText("เป้าหมายคำศัพท์ต่อวัน"), "25")
    await user.clear(screen.getByLabelText("เวลาฝึกต่อวัน (นาที)"))
    await user.type(screen.getByLabelText("เวลาฝึกต่อวัน (นาที)"), "30")
    await user.click(screen.getByRole("button", { name: "บันทึกเป้าหมาย" }))

    expect(mocks.updatePreferences).toHaveBeenCalledWith({
      dailyVocabularyGoal: 25,
      dailyPracticeMinutes: 30,
    })
  })

  it("applies language and speech preferences without offering theme controls", async () => {
    const user = userEvent.setup()
    render(<ProfileSettings />)

    await user.selectOptions(screen.getByLabelText("ภาษาแอป"), "en")
    await user.selectOptions(screen.getByLabelText("สำเนียงเสียงอ่าน"), "en-GB")
    await user.selectOptions(screen.getByLabelText("ความเร็วเสียงอ่าน"), "1.25")
    await user.click(screen.getByRole("checkbox", { name: "เล่นเสียงอัตโนมัติ" }))

    expect(mocks.updatePreferences).toHaveBeenCalledWith({ language: "en" })
    expect(screen.queryByRole("option", { name: "Dark" })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "System" })).not.toBeInTheDocument()
    expect(mocks.updatePreferences).toHaveBeenCalledWith({
      speechLocale: "en-GB",
      speechVoiceUri: null,
    })
    expect(mocks.updatePreferences).toHaveBeenCalledWith({ speechRate: 1.25 })
    expect(mocks.updatePreferences).toHaveBeenCalledWith({ speechAutoPlay: false })
  })

  it("opens the existing personal profile editor", async () => {
    const user = userEvent.setup()
    const onEditPersonalData = vi.fn()
    render(<ProfileSettings onEditPersonalData={onEditPersonalData} />)

    await user.click(screen.getByRole("button", { name: /จัดการข้อมูลส่วนตัว/ }))
    expect(onEditPersonalData).toHaveBeenCalledTimes(1)
  })

  it("enables a scheduled push reminder only after subscribing", async () => {
    const user = userEvent.setup()
    render(<ProfileSettings />)

    await user.click(screen.getByRole("button", { name: /การแจ้งเตือน/ }))
    await user.clear(screen.getByLabelText("เวลาแจ้งเตือน"))
    await user.type(screen.getByLabelText("เวลาแจ้งเตือน"), "08:30")
    await user.click(screen.getByRole("checkbox", { name: "เปิดการแจ้งเตือน" }))

    expect(mocks.enablePushNotifications).toHaveBeenCalledWith("user-1")
    expect(mocks.updatePreferences).toHaveBeenCalledWith(expect.objectContaining({
      reminderEnabled: true,
      reminderTime: "08:30",
    }))
    expect(mocks.enablePushNotifications.mock.invocationCallOrder[0]).toBeLessThan(mocks.updatePreferences.mock.invocationCallOrder.at(-1)!)
  })

  it("allows an existing reminder to be turned off when push is unavailable", async () => {
    Object.assign(mocks.preferences, { reminderEnabled: true })
    Object.assign(mocks.pushCapability, { supported: false, permission: "unsupported" })
    const user = userEvent.setup()
    render(<ProfileSettings />)

    await user.click(screen.getByRole("button", { name: /การแจ้งเตือน/ }))
    const checkbox = screen.getByRole("checkbox", { name: "เปิดการแจ้งเตือน" })
    expect(checkbox).toBeEnabled()
    await user.click(checkbox)

    expect(mocks.disablePushNotifications).toHaveBeenCalledWith("user-1")
    expect(mocks.updatePreferences).toHaveBeenCalledWith({ reminderEnabled: false })
  })

  it("turns off reminder scheduling even when subscription cleanup fails", async () => {
    Object.assign(mocks.preferences, { reminderEnabled: true })
    mocks.disablePushNotifications.mockRejectedValue(new Error("cleanup failed"))
    const user = userEvent.setup()
    render(<ProfileSettings />)

    await user.click(screen.getByRole("button", { name: /การแจ้งเตือน/ }))
    await user.click(screen.getByRole("checkbox", { name: "เปิดการแจ้งเตือน" }))

    expect(mocks.updatePreferences).toHaveBeenCalledWith({ reminderEnabled: false })
  })
})
