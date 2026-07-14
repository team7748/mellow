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
import { GuestNotice } from "../auth/GuestNotice"
import { PageHeader } from "../layout/PageHeader"

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
    hint: "ยังไม่มีความคืบหน้า",
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
    label: "จำได้มั่นใจ",
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
      message: "รีเซ็ตความคืบหน้าแล้ว",
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
      message: "บันทึกไฟล์ความคืบหน้าแล้ว",
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
        message: "นำเข้าความคืบหน้าแล้ว",
      })
    } catch {
      setNotice({
        tone: "error",
        message: "อ่านไฟล์ความคืบหน้าไม่สำเร็จ",
      })
    } finally {
      event.target.value = ""
    }
  }

  return (
    <section aria-labelledby="dashboard-heading" className="space-y-6 pt-4 sm:pt-6">
      <GuestNotice onLoginClick={() => window.location.hash = "auth"} />
      
      <PageHeader
        subtitle="ความคืบหน้าของคุณ"
        title="สรุปผลการเรียน"
        description="สรุปความคืบหน้าจากคำศัพท์จริงและข้อมูลที่บันทึกไว้ในเครื่องนี้"
        rightContent={
          <div className="min-w-36 rounded-2xl border border-primary/20 bg-primary-soft px-5 py-4 text-center">
            <p className="text-4xl font-black text-primary">{progressPercentage}%</p>
            <p className="mt-1 text-xs font-bold text-ink-dark uppercase tracking-wide">ความคืบหน้า</p>
          </div>
        }
      />

      <div className="mb-10">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-ink-dark tracking-wide uppercase">
          <span>เริ่มต้น</span>
          <span>จำได้ครบ</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-primary-active">
          <div
            aria-label={`ความคืบหน้า ${progressPercentage}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progressPercentage}
            className="h-full rounded-full bg-primary transition-all duration-300"
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

      <div className="mt-8 border-t border-primary/20 pt-8">
        <h3 className="text-sm font-bold text-ink-dark mb-4">การจัดการข้อมูล</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            className="w-full sm:w-auto text-sm"
            variant="secondary"
            onClick={handleExportProgress}
          >
            <Download aria-hidden="true" className="mr-2 h-4 w-4" />
            บันทึกไฟล์ความคืบหน้า
          </Button>
          <Button
            className="w-full sm:w-auto text-sm"
            variant="secondary"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
            นำเข้าไฟล์ความคืบหน้า
          </Button>
          <input
            ref={importInputRef}
            accept="application/json,.json"
            aria-label="นำเข้าไฟล์ความคืบหน้า"
            className="sr-only"
            type="file"
            onChange={handleImportProgress}
          />
          <Button
            className="w-full sm:w-auto text-sm"
            variant="danger"
            onClick={handleResetProgress}
          >
            <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />
            รีเซ็ตความคืบหน้า
          </Button>
        </div>

        {notice ? (
          <p
            className={`mt-3 rounded-lg border px-3 py-2 text-sm font-semibold ${
              notice.tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-primary/20 bg-primary-soft text-primary"
            }`}
          >
            {notice.message}
          </p>
        ) : null}
      </div>
    </section>
  )
}
