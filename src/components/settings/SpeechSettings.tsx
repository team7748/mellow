import { useState } from "react"
import {
  type SpeechSettings as SpeechSettingsValue,
  loadSpeechSettings,
  saveSpeechSettings,
} from "../../lib/speechSettings"

const languageOptions = [
  { label: "อังกฤษอเมริกัน", value: "en-US" },
  { label: "อังกฤษบริติช", value: "en-GB" },
] as const

const rateOptions = [
  { label: "ช้า", value: 0.75 },
  { label: "ปกติ", value: 0.9 },
  { label: "เร็ว", value: 1.05 },
] as const

export function SpeechSettings() {
  const [settings, setSettings] = useState<SpeechSettingsValue>(loadSpeechSettings)

  function updateSettings(nextSettings: SpeechSettingsValue) {
    setSettings(nextSettings)
    saveSpeechSettings(nextSettings)
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-DEFAULT">ตั้งค่าเสียงอ่าน</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            เลือกสำเนียงและความเร็วสำหรับปุ่มฟังเสียงคำศัพท์
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-ink-DEFAULT">
            สำเนียงเสียงอ่าน
            <select
              aria-label="สำเนียงเสียงอ่าน"
              className="mt-1 block min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink-DEFAULT focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              value={settings.lang}
              onChange={(event) =>
                updateSettings({
                  ...settings,
                  lang: event.target.value as SpeechSettingsValue["lang"],
                })
              }
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-ink-DEFAULT">
            ความเร็วเสียงอ่าน
            <select
              aria-label="ความเร็วเสียงอ่าน"
              className="mt-1 block min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink-DEFAULT focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              value={settings.rate}
              onChange={(event) =>
                updateSettings({
                  ...settings,
                  rate: Number(event.target.value) as SpeechSettingsValue["rate"],
                })
              }
            >
              {rateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}
