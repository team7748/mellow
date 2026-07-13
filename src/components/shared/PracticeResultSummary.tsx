import {
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  MessageSquare,
} from "lucide-react"
import { Button } from "../ui/Button"

export type ErrorBreakdown = {
  type: string
  count: number
}

export type MistakeItem = {
  id: string
  userAnswer: string
  correctAnswer: string
  reason?: string
}

export type PracticeResultSummaryProps = {
  score: number
  total: number
  accuracy: number
  timeTakenStr?: string
  errorBreakdown?: ErrorBreakdown[]
  mistakes: MistakeItem[]
  onReviewMissed?: () => void
  onRetry: () => void
  onHome: () => void
}

// ── Internal helpers ──

function getAnalysisText(accuracy: number, errors: ErrorBreakdown[]): string {
  const topError =
    errors.length > 0
      ? errors.reduce((a, b) => (a.count > b.count ? a : b))
      : null

  if (accuracy >= 90) {
    return "ยอดเยี่ยม! คุณทำได้ดีมากในรอบนี้"
  }
  if (accuracy >= 70) {
    return topError
      ? `ดีมาก! แต่ยังมีผิดเรื่อง "${topError.type}" อยู่บ้าง ลองทบทวนจุดนี้เพิ่มอีกนิด`
      : "ดีมาก! มีจุดเล็ก ๆ ที่ปรับปรุงได้"
  }
  if (accuracy >= 50) {
    return topError
      ? `ทำได้ดี! เรื่อง "${topError.type}" เป็นจุดที่ควรฝึกเพิ่ม`
      : "ทำได้ดี แต่ยังมีบางจุดที่ควรทบทวน"
  }
  return "ยังต้องฝึกฝนอีกนิด ลองทบทวนแล้วทำอีกครั้ง"
}

function getNextStepText(accuracy: number, hasMistakes: boolean): string {
  if (accuracy >= 90) {
    return "ลองเพิ่มความท้าทายด้วยชุดใหม่ หรือเปลี่ยนโหมดฝึก"
  }
  if (hasMistakes) {
    return "ทบทวนข้อที่ผิดก่อน จะช่วยให้จำได้แม่นยำขึ้น"
  }
  return "ลองทำชุดเดิมอีกครั้ง จะช่วยให้เข้าใจมากขึ้น"
}

export function PracticeResultSummary({
  score,
  total,
  accuracy,
  timeTakenStr,
  errorBreakdown = [],
  mistakes = [],
  onReviewMissed,
  onRetry,
  onHome,
}: PracticeResultSummaryProps) {
  const hasMistakes = mistakes.length > 0
  const analysisText = getAnalysisText(accuracy, errorBreakdown)
  const nextStepText = getNextStepText(accuracy, hasMistakes)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16 sm:px-6 flex flex-col gap-12">
      {/* ── 1. Main Score ── */}
      <section className="flex flex-col items-center text-center">
        <h2 className="text-sm font-semibold tracking-wide text-ink-secondary mb-4">สรุปผลการฝึก</h2>
        
        <div className="flex items-baseline justify-center gap-2 mb-8">
          <span className="text-7xl font-extrabold text-ink-dark tabular-nums tracking-tighter">
            {score}
          </span>
          <span className="text-2xl font-bold text-ink-secondary">/ {total}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-10">
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
              ความแม่นยำ
            </span>
            <span className="text-2xl font-bold text-ink-dark mt-1">{accuracy}%</span>
          </div>
          {timeTakenStr && (
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
                เวลาที่ใช้
              </span>
              <span className="text-2xl font-bold text-ink-dark mt-1">{timeTakenStr}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Analysis Text ── */}
      <section className="flex items-start gap-4">
        <MessageSquare className="w-6 h-6 text-sky-500 shrink-0 mt-0.5" />
        <p className="text-lg font-medium text-ink-DEFAULT leading-relaxed">
          {analysisText}
        </p>
      </section>

      {/* ── 3. Error Breakdown ── */}
      {errorBreakdown.length > 0 && (
        <section className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-ink-dark flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            ประเภทข้อผิดพลาด
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {errorBreakdown.map((err, idx) => (
              <div
                key={idx}
                className="flex flex-col p-4 rounded-2xl bg-orange-50/50 ring-1 ring-orange-100"
              >
                <span className="text-sm font-medium text-orange-900/70">{err.type}</span>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-2xl font-bold text-orange-600">{err.count}</span>
                  <span className="text-sm font-medium text-orange-600/60">ครั้ง</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Mistakes List ── */}
      {hasMistakes && (
        <section className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-ink-dark">
            รายการข้อที่ผิด ({mistakes.length})
          </h3>
          <div className="flex flex-col gap-3">
            {mistakes.map((m) => (
              <div key={m.id} className="flex flex-col gap-3 bg-slate-50/80 rounded-2xl p-5 ring-1 ring-border">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="font-medium text-rose-900 line-through decoration-rose-300">
                    {m.userAnswer || "(ไม่ได้ตอบ)"}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-ink-dark">{m.correctAnswer}</p>
                    {m.reason && (
                      <p className="text-sm font-medium text-primary leading-relaxed">
                        {m.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. Next Step Recommendation ── */}
      <section>
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-primary-soft ring-1 ring-primary/20">
          <Lightbulb className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <h3 className="text-base font-bold text-ink-dark">ขั้นตอนถัดไป</h3>
            <p className="text-sm font-medium text-ink-dark leading-relaxed">
              {nextStepText}
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. Actions ── */}
      <section className="flex flex-col gap-3 pt-2">
        {hasMistakes && onReviewMissed && (
          <Button
            onClick={onReviewMissed}
            className="w-full text-lg py-4 min-h-[64px] shadow-sm rounded-2xl"
          >
            <TrendingUp className="w-5 h-5 mr-2.5" />
            ทบทวนข้อที่ผิด
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={onRetry}
          className="w-full text-base py-4 min-h-[60px] rounded-2xl"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          ทำใหม่ทั้งหมด
        </Button>
        <Button
          variant="custom"
          onClick={onHome}
          className="inline-flex items-center justify-center w-full rounded-2xl px-5 py-4 text-base font-semibold min-h-[60px] bg-slate-100 text-ink-DEFAULT hover:bg-slate-200 active:scale-[0.98] transition-all"
        >
          <Home className="w-5 h-5 mr-2" />
          กลับหน้าหลัก
        </Button>
      </section>
    </div>
  )
}
