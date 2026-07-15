import { useEffect, useState, type FormEvent } from "react"
import { Bell, ChevronDown, ChevronRight, Languages, Loader2, Target, UserRound, Volume2, CheckCircle2 } from "lucide-react"
import { usePreferences } from "../../hooks/usePreferences"
import { useAuth } from "../../hooks/useAuth"
import { disablePushNotifications, enablePushNotifications, getPushCapability } from "../../lib/notifications/pushNotifications"
import type { AppLanguage, SpeechLocale } from "../../types/preferences"

const fieldClass = "min-h-11 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"

export function ProfileSettings({ onEditPersonalData }: { onEditPersonalData?: () => void }) {
  const { preferences, status, error, updatePreferences } = usePreferences()
  const { user } = useAuth()
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [reminderTime, setReminderTime] = useState(preferences.reminderTime)
  const [notificationBusy, setNotificationBusy] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [vocabularyGoal, setVocabularyGoal] = useState(String(preferences.dailyVocabularyGoal))
  const [practiceMinutes, setPracticeMinutes] = useState(String(preferences.dailyPracticeMinutes))
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    setVocabularyGoal(String(preferences.dailyVocabularyGoal))
    setPracticeMinutes(String(preferences.dailyPracticeMinutes))
  }, [preferences.dailyPracticeMinutes, preferences.dailyVocabularyGoal])

  useEffect(() => setReminderTime(preferences.reminderTime), [preferences.reminderTime])

  useEffect(() => {
    if (!("speechSynthesis" in window) || !window.speechSynthesis) return
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices())
    loadVoices()
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices)
  }, [])

  async function saveGoals(event: FormEvent) {
    event.preventDefault()
    const saved = await updatePreferences({
      dailyVocabularyGoal: Number(vocabularyGoal),
      dailyPracticeMinutes: Number(practiceMinutes),
    })
    if (saved) {
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 2000)
    }
  }

  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"))
  const pushCapability = getPushCapability()

  async function toggleReminder(enabled: boolean) {
    setNotificationError(null)
    if (!user) {
      setNotificationError("กรุณาเข้าสู่ระบบเพื่อเปิดการแจ้งเตือน")
      return
    }
    setNotificationBusy(true)
    try {
      if (enabled) {
        await enablePushNotifications(user.id)
        const saved = await updatePreferences({
          reminderEnabled: true,
          reminderTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok",
        })
        if (!saved) {
          await disablePushNotifications(user.id).catch(() => undefined)
          throw new Error("preference-save-failed")
        }
      } else {
        const saved = await updatePreferences({ reminderEnabled: false })
        if (!saved) throw new Error("preference-save-failed")
        try {
          await disablePushNotifications(user.id)
        } catch {
          setNotificationError("ปิดการแจ้งเตือนแล้ว แต่ล้างการสมัครรับแจ้งเตือนไม่สำเร็จ")
        }
      }
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "unknown"
      setNotificationError(
        code === "unsupported" ? "เบราว์เซอร์นี้ไม่รองรับ Push Notification"
          : code === "missing-public-key" ? "ระบบแจ้งเตือนยังไม่ได้ตั้งค่า VAPID public key"
            : code === "permission-denied" ? "การแจ้งเตือนถูกบล็อก กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์"
              : code === "preference-save-failed" ? "บันทึกการตั้งค่าแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่"
                : "เปิดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่",
      )
    } finally {
      setNotificationBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <section aria-labelledby="settings-goals-title">
        <h3 id="settings-goals-title" className="mb-3 text-sm font-semibold text-ink">
          เป้าหมายและการแจ้งเตือน
        </h3>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card divide-y divide-border/40">
          <div>
          <button
            type="button"
            aria-expanded={goalsOpen}
            onClick={() => setGoalsOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 text-ink-secondary">
                <Target className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">เป้าหมายการเรียน</span>
                <span className="block text-xs text-ink-secondary">
                  {preferences.dailyVocabularyGoal} คำ · {preferences.dailyPracticeMinutes} นาทีต่อวัน
                </span>
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-ink-secondary transition-transform ${goalsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {goalsOpen ? (
            <form onSubmit={saveGoals} className="grid gap-3 border-t border-border/40 bg-slate-50/50 px-4 py-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-ink-secondary">
                เป้าหมายคำศัพท์ต่อวัน
                <input
                  aria-label="เป้าหมายคำศัพท์ต่อวัน"
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={vocabularyGoal}
                  onChange={(event) => setVocabularyGoal(event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="text-xs font-semibold text-ink-secondary">
                เวลาฝึกต่อวัน (นาที)
                <input
                  aria-label="เวลาฝึกต่อวัน (นาที)"
                  type="number"
                  min={1}
                  max={240}
                  required
                  value={practiceMinutes}
                  onChange={(event) => setPracticeMinutes(event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <button type="submit" disabled={status === "saving" || showSaveSuccess} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 sm:col-span-2 flex items-center justify-center gap-2">
                {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-label="กำลังบันทึก" /> : showSaveSuccess ? <><CheckCircle2 className="h-4 w-4" /> บันทึกแล้ว</> : "บันทึกเป้าหมาย"}
              </button>
            </form>
          ) : null}
        </div>

        <div>
          <button type="button" aria-expanded={reminderOpen} onClick={() => setReminderOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-ink-secondary"><Bell className="h-4 w-4" aria-hidden="true" /></span>
              <span><span className="block text-sm font-semibold text-ink">การแจ้งเตือน</span><span className="block text-xs text-ink-secondary">{preferences.reminderEnabled ? `ทุกวัน เวลา ${preferences.reminderTime}` : "ปิดอยู่"}</span></span>
            </span>
            <ChevronDown className={`h-4 w-4 text-ink-secondary transition-transform ${reminderOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {reminderOpen ? (
            <div className="space-y-3 border-t border-border/40 bg-slate-50/50 px-4 py-4">
              {!pushCapability.supported ? <p className="text-xs text-ink-secondary">เบราว์เซอร์นี้ไม่รองรับ Push Notification</p> : null}
              {pushCapability.supported && !pushCapability.configured ? <p className="text-xs text-ink-secondary">ต้องตั้งค่า VAPID public key ก่อนเปิดใช้งาน</p> : null}
              <label className="block text-xs font-semibold text-ink-secondary">เวลาแจ้งเตือน<input aria-label="เวลาแจ้งเตือน" type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} className={`${fieldClass} mt-1`} /></label>
              <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-ink">เปิดการแจ้งเตือน<input aria-label="เปิดการแจ้งเตือน" type="checkbox" checked={preferences.reminderEnabled} disabled={notificationBusy} onChange={(event) => void toggleReminder(event.target.checked)} className="h-5 w-5 accent-primary" /></label>
              {notificationError ? <p role="alert" className="text-xs font-medium text-red-600">{notificationError}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
      </section>

      <section aria-labelledby="settings-general-title">
        <h3 id="settings-general-title" className="mb-3 text-sm font-semibold text-ink">
          การตั้งค่าทั่วไป
        </h3>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card divide-y divide-border/40">
          <button type="button" onClick={onEditPersonalData} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80">
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-ink-secondary"><UserRound className="h-4 w-4" aria-hidden="true" /></span>
            <span><span className="block text-sm font-semibold text-ink">จัดการข้อมูลส่วนตัว</span><span className="block text-xs text-ink-secondary">แก้ไขชื่อและรูปโปรไฟล์</span></span>
          </span>
          <ChevronRight className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
        </button>

        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 sm:col-span-2">
            <Languages className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink">ภาษา</p>
          </div>
          <label className="text-xs font-semibold text-ink-secondary sm:col-span-2">
            ภาษาแอป
            <select aria-label="ภาษาแอป" value={preferences.language} onChange={(event) => void updatePreferences({ language: event.target.value as AppLanguage })} className={`${fieldClass} mt-1`}>
              <option value="th">ไทย</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 sm:col-span-2">
            <Volume2 className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink">เสียงและการออกเสียง</p>
          </div>
          <label className="text-xs font-semibold text-ink-secondary">
            สำเนียงเสียงอ่าน
            <select aria-label="สำเนียงเสียงอ่าน" value={preferences.speechLocale} onChange={(event) => void updatePreferences({ speechLocale: event.target.value as SpeechLocale, speechVoiceUri: null })} className={`${fieldClass} mt-1`}>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-ink-secondary">
            ความเร็วเสียงอ่าน
            <select aria-label="ความเร็วเสียงอ่าน" value={preferences.speechRate} onChange={(event) => void updatePreferences({ speechRate: Number(event.target.value) })} className={`${fieldClass} mt-1`}>
              <option value="0.75">0.75×</option>
              <option value="1">1×</option>
              <option value="1.25">1.25×</option>
              <option value="1.5">1.5×</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-ink-secondary sm:col-span-2">
            เสียง
            <select aria-label="เสียงอ่าน" value={preferences.speechVoiceUri ?? ""} onChange={(event) => void updatePreferences({ speechVoiceUri: event.target.value || null })} className={`${fieldClass} mt-1`}>
              <option value="">เสียงเริ่มต้นของอุปกรณ์</option>
              {englishVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}
            </select>
          </label>
          <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm font-medium text-ink sm:col-span-2">
            เล่นเสียงอัตโนมัติ
            <input aria-label="เล่นเสียงอัตโนมัติ" type="checkbox" checked={preferences.speechAutoPlay} onChange={(event) => void updatePreferences({ speechAutoPlay: event.target.checked })} className="h-5 w-5 accent-primary" />
          </label>
        </div>
        </div>
      </section>
      {error ? <p role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  )
}
