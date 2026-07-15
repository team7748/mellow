import { usePreferences } from "../../hooks/usePreferences"
import type { SpeechLocale } from "../../types/preferences"

const selectClass = "mt-1 block min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"

export function SpeechSettings() {
  const { preferences, updatePreferences } = usePreferences()

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">ตั้งค่าเสียงอ่าน</h2>
          <p className="mt-1 text-sm text-ink-secondary">เลือกสำเนียงและความเร็วสำหรับปุ่มฟังเสียงคำศัพท์</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-ink">
            สำเนียงเสียงอ่าน
            <select aria-label="สำเนียงเสียงอ่าน" className={selectClass} value={preferences.speechLocale} onChange={(event) => void updatePreferences({ speechLocale: event.target.value as SpeechLocale })}>
              <option value="en-US">อังกฤษอเมริกัน</option>
              <option value="en-GB">อังกฤษบริติช</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-ink">
            ความเร็วเสียงอ่าน
            <select aria-label="ความเร็วเสียงอ่าน" className={selectClass} value={preferences.speechRate} onChange={(event) => void updatePreferences({ speechRate: Number(event.target.value) })}>
              <option value="0.75">ช้า</option>
              <option value="1">ปกติ</option>
              <option value="1.05">ค่อนข้างเร็ว</option>
              <option value="1.25">เร็ว</option>
              <option value="1.5">เร็วมาก</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}
