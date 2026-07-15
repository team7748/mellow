import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ language: "th" as "th" | "en" }))
vi.mock("../hooks/usePreferences", () => ({
  usePreferences: () => ({ preferences: { language: mocks.language } }),
}))

import { I18nProvider, useI18n } from "./I18nContext"

function Probe() {
  const { t } = useI18n()
  return <span>{t("profile.title")}</span>
}

describe("I18nProvider", () => {
  beforeEach(() => { mocks.language = "th" })

  it("renders Thai and updates the document language", async () => {
    render(<I18nProvider><Probe /></I18nProvider>)
    expect(screen.getByText("โปรไฟล์")).toBeInTheDocument()
    await waitFor(() => expect(document.documentElement.lang).toBe("th"))
  })

  it("renders English from the same translation key", () => {
    mocks.language = "en"
    render(<I18nProvider><Probe /></I18nProvider>)
    expect(screen.getByText("Profile")).toBeInTheDocument()
  })
})
