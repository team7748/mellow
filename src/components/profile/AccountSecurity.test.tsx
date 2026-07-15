import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AccountSecurity } from "./AccountSecurity"

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updatePassword: vi.fn(),
}))

vi.mock("../../services/authService", () => mocks)

describe("AccountSecurity", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.updatePassword.mockResolvedValue({ success: true })
    mocks.resetPasswordForEmail.mockResolvedValue({ success: true })
    mocks.logout.mockResolvedValue({ success: true })
  })

  it("validates confirmation and changes the password", async () => {
    const user = userEvent.setup()
    render(<AccountSecurity email="learner@example.com" />)

    await user.click(screen.getByRole("button", { name: /ความปลอดภัย/ }))
    await user.type(screen.getByLabelText("รหัสผ่านใหม่"), "new-password-123")
    await user.type(screen.getByLabelText("ยืนยันรหัสผ่านใหม่"), "different-password")
    await user.click(screen.getByRole("button", { name: "เปลี่ยนรหัสผ่าน" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("รหัสผ่านไม่ตรงกัน")
    expect(mocks.updatePassword).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText("ยืนยันรหัสผ่านใหม่"))
    await user.type(screen.getByLabelText("ยืนยันรหัสผ่านใหม่"), "new-password-123")
    await user.click(screen.getByRole("button", { name: "เปลี่ยนรหัสผ่าน" }))
    expect(mocks.updatePassword).toHaveBeenCalledWith("new-password-123")
    expect(await screen.findByRole("status")).toHaveTextContent("เปลี่ยนรหัสผ่านแล้ว")
  })

  it("sends a reset email and signs out through Supabase Auth", async () => {
    const user = userEvent.setup()
    render(<AccountSecurity email="learner@example.com" />)

    await user.click(screen.getByRole("button", { name: /ความปลอดภัย/ }))
    await user.click(screen.getByRole("button", { name: "ส่งอีเมลรีเซ็ตรหัสผ่าน" }))
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith("learner@example.com")

    await user.click(screen.getByRole("button", { name: "ออกจากระบบ" }))
    expect(mocks.logout).toHaveBeenCalledTimes(1)
  })
})
