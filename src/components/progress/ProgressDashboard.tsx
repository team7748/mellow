import { type ChangeEvent, useRef, useState } from "react"
import { Download, RotateCcw, Upload } from "lucide-react"
import {
  importProgress,
  PROGRESS_EXPORT_FILENAME,
  serializeProgress,
} from "../../lib/storage"
import type { ProgressStats } from "../../types/vocabulary"
import { calculateProgressStats, resetProgress } from "../../utils/vocabulary"
import { Button } from "../ui/Button"
import { StatCard } from "../ui/StatCard"

type Notice = {
  tone: "success" | "error"
  message: string
}

const statCards = [
  {
    key: "totalWords",
    label: "คำศัพท์ทั้งหมด",
    hint: "จากไฟล์ข้อมูลจริง",
  },
  {
    key: "newWords",
    label: "ยังไม่เรียน",
    hint: "ยังไม่มี progress",
  },
  {
    key: "learningWords",
    label: "กำลังเรียน",
    hint: "เริ่มฝึกแล้ว",
  },
  {
    key: "dueReviewWords",
    label: "ต้องทบทวน",
    hint: "ถึงรอบฝึกซ้ำ",
  },
  {
    key: "masteredWords",
    label: "Mastered",
    hint: "จำได้มั่นใจขึ้น",
  },
] satisfies Array<{
  key: keyof ProgressStats
  label: string
  hint: string
}>

export function calculateProgressPercentage(
  totalWords: number,
  masteredWords: number,
) {
  if (totalWords <= 0) {
    return 0
  }

  return Math.round((masteredWords / totalWords) * 100)
}

function readProgressFile(file: File) {
  if (typeof file.text === "function") {
    return file.text()
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener("load", () => {
      resolve(String(reader.result ?? ""))
    })
    reader.addEventListener("error", () => reject(reader.error))
    reader.readAsText(file)
  })
}

export function ProgressDashboard() {
  const [stats, setStats] = useState(() => calculateProgressStats())
  const [notice, setNotice] = useState<Notice | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const progressPercentage = calculateProgressPercentage(
    stats.totalWords,
    stats.masteredWords,
  )

  function refreshStats() {
    setStats(calculateProgressStats())
  }

  function handleResetProgress() {
    resetProgress()
    refreshStats()
    setNotice({
      tone: "success",
      message: "รีเซ็ต progress แล้ว",
    })
  }

  function handleExportProgress() {
    const progressJson = serializeProgress()
    const blob = new Blob([progressJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = PROGRESS_EXPORT_FILENAME
    link.click()
    URL.revokeObjectURL(url)
    setNotice({
      tone: "success",
      message: "Export progress แล้ว",
    })
  }

  async function handleImportProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      const result = importProgress(await readProgressFile(file))

      if (!result.ok) {
        setNotice({
          tone: "error",
          message: result.error,
        })
        return
      }

      refreshStats()
      setNotice({
        tone: "success",
        message: "นำเข้า progress แล้ว",
      })
    } catch {
      setNotice({
        tone: "error",
        message: "อ่านไฟล์ progress ไม่สำเร็จ",
      })
    } finally {
      event.target.value = ""
    }
  }

  return (
    <section aria-labelledby="dashboard-heading" className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-leaf">
              Progress Dashboard
            </p>
            <h1
              id="dashboard-heading"
              className="mt-2 text-3xl font-bold text-ink sm:text-4xl"
            >
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-700">
              สรุปความคืบหน้าจากคำศัพท์จริงและ progress ที่บันทึกไว้ในเครื่องนี้
            </p>
          </div>
          <div className="min-w-36 rounded-lg bg-emerald-50 px-5 py-4 text-center ring-1 ring-emerald-100">
            <p className="text-4xl font-bold text-leaf">{progressPercentage}%</p>
            <p className="mt-1 text-sm font-medium text-slate-600">ความคืบหน้า</p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            aria-label={`ความคืบหน้า ${progressPercentage}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progressPercentage}
            className="h-full rounded-full bg-leaf transition-all"
            role="progressbar"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={String(stats[card.key])}
            hint={card.hint}
          />
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            className="bg-white text-leaf ring-1 ring-slate-200 hover:bg-emerald-50"
            onClick={handleExportProgress}
          >
            <Download aria-hidden="true" className="mr-2 h-4 w-4" />
            Export progress
          </Button>
          <Button
            className="bg-white text-leaf ring-1 ring-slate-200 hover:bg-emerald-50"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
            Import progress
          </Button>
          <input
            ref={importInputRef}
            accept="application/json,.json"
            aria-label="Import progress"
            className="sr-only"
            type="file"
            onChange={handleImportProgress}
          />
          <Button
            className="bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
            onClick={handleResetProgress}
          >
            <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />
            Reset progress
          </Button>
        </div>

        {notice ? (
          <p
            className={`mt-3 text-sm font-medium ${
              notice.tone === "error" ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {notice.message}
          </p>
        ) : null}
      </div>
    </section>
  )
}
