import { useEffect, useState, type FormEvent } from "react"
import { ChevronDown, Loader2, Monitor, Target, Volume2 } from "lucide-react"
import { usePreferences } from "../../hooks/usePreferences"
import type { AppLanguage, AppTheme, SpeechLocale } from "../../types/preferences"

const fieldClass = "min-h-11 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"

export function ProfileSettings() {
  const { preferences, status, error, updatePreferences } = usePreferences()
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [vocabularyGoal, setVocabularyGoal] = useState(String(preferences.dailyVocabularyGoal))
  const [practiceMinutes, setPracticeMinutes] = useState(String(preferences.dailyPracticeMinutes))
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    setVocabularyGoal(String(preferences.dailyVocabularyGoal))
    setPracticeMinutes(String(preferences.dailyPracticeMinutes))
  }, [preferences.dailyPracticeMinutes, preferences.dailyVocabularyGoal])

  useEffect(() => {
    if (!("speechSynthesis" in window) || !window.speechSynthesis) return
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices())
    loadVoices()
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices)
  }, [])

  async function saveGoals(event: FormEvent) {
    event.preventDefault()
    await updatePreferences({
      dailyVocabularyGoal: Number(vocabularyGoal),
      dailyPracticeMinutes: Number(practiceMinutes),
    })
  }

  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"))

  return (
    <section aria-labelledby="profile-settings-title">
      <h3 id="profile-settings-title" className="mb-2 text-sm font-semibold text-ink">
        การตั้งค่า
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
              <button type="submit" disabled={status === "saving"} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 sm:col-span-2">
                {status === "saving" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-label="กำลังบันทึก" /> : "บันทึกเป้าหมาย"}
              </button>
            </form>
          ) : null}
        </div>

        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 sm:col-span-2">
            <Monitor className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink">ภาษาและการแสดงผล</p>
          </div>
          <label className="text-xs font-semibold text-ink-secondary">
            ภาษาแอป
            <select aria-label="ภาษาแอป" value={preferences.language} onChange={(event) => void updatePreferences({ language: event.target.value as AppLanguage })} className={`${fieldClass} mt-1`}>
              <option value="th">ไทย</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-ink-secondary">
            ธีมการแสดงผล
            <select aria-label="ธีมการแสดงผล" value={preferences.theme} onChange={(event) => void updatePreferences({ theme: event.target.value as AppTheme })} className={`${fieldClass} mt-1`}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
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
      {error ? <p role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
    </section>
  )
}
