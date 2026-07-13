import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Eye,
  Filter,
  Keyboard,
} from "lucide-react"
import { useMemo } from "react"
import { useQuizSetup, type PracticeType } from "../../hooks/useQuizSetup"
import type { VocabCategory } from "../../types/vocabulary"
import { getAllCategories, getCategoryWordCount } from "../../utils/vocabulary"
import { categoryThaiLabels } from "../../data/categoryIconMap"
import { Button } from "../ui/Button"

// ─── Constants ─────────────────────────────────────────────────────────────────

const PRACTICE_TYPES: Array<{
  value: PracticeType
  label: string
  labelThai: string
  icon: React.ReactNode
}> = [
  {
    value: "multiple_choice",
    label: "Multiple Choice",
    labelThai: "เลือกคำตอบจาก 4 ตัวเลือก",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    value: "fill_blank",
    label: "Fill in the Blank",
    labelThai: "เติมคำในประโยคตัวอย่าง",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    value: "typing",
    label: "Typing Practice",
    labelThai: "พิมพ์คำศัพท์จากคำแปลไทย",
    icon: <Keyboard className="h-4 w-4" />,
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="surface-section">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
          {icon}
        </span>
        <h2 className="text-sm font-bold text-ink-DEFAULT">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

type QuizSetupProps = {
  onStart: (wordIds: string[]) => void
  onBackToHome: () => void
}

export function QuizSetup({ onStart, onBackToHome }: QuizSetupProps) {
  const {
    selectedCategory,
    practiceType,
    categoryWords,
    updateCategory,
    updatePracticeType,
    resetFilters,
    generatePracticeSet,
  } = useQuizSetup()

  const categories = useMemo(() => getAllCategories(), [])
  const categoryCounts = useMemo(() => getCategoryWordCount(), [])

  const isAnyFilterActive = selectedCategory !== "all" || practiceType !== "multiple_choice"

  function handleStart() {
    const ids = generatePracticeSet()
    if (ids.length > 0) onStart(ids)
  }

  const categoryDisplayLabel =
    selectedCategory === "all"
      ? "ทุกหมวดหมู่"
      : categoryThaiLabels[selectedCategory] ?? selectedCategory

  const practiceTypeLabel =
    PRACTICE_TYPES.find((t) => t.value === practiceType)?.label ?? practiceType

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBackToHome}
          className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="กลับหน้าหลัก"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          หน้าหลัก
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">
              Practice
            </p>
            <h1 className="text-xl font-bold text-ink-DEFAULT sm:text-2xl">
              เลือกหมวดหมู่และประเภทแบบฝึก
            </h1>
          </div>
        </div>
      </div>

      {/* ── Two-Column Grid ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Category Card */}
        <SectionCard
          title="หมวดหมู่คำศัพท์"
          icon={<Filter className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <label
              htmlFor="quiz-category"
              className="block text-xs font-semibold text-ink-secondary"
            >
              เลือกหมวดหมู่
            </label>
            <select
              id="quiz-category"
              value={selectedCategory}
              onChange={(e) =>
                updateCategory(e.target.value as "all" | VocabCategory)
              }
              className="ui-control font-semibold"
              aria-label="เลือกหมวดหมู่คำศัพท์"
            >
              <option value="all">
                ทุกหมวดหมู่
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryThaiLabels[cat]
                    ? `${categoryThaiLabels[cat]} (${cat})`
                    : cat}{" "}
                  — {categoryCounts[cat] ?? 0} คำ
                </option>
              ))}
            </select>

            {/* Quick category chips for popular ones */}
            <div className="flex flex-wrap gap-1.5">
              {["all" as const, ...categories.slice(0, 8)].map((cat) => {
                const isSelected = selectedCategory === cat
                const label =
                  cat === "all"
                    ? "ทั้งหมด"
                    : categoryThaiLabels[cat] ?? cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateCategory(cat)}
                    aria-pressed={isSelected}
                    className={`ui-chip text-xs ${isSelected ? "ui-chip-selected" : ""}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </SectionCard>

        {/* Practice Type Card */}
        <SectionCard
          title="ประเภทแบบฝึก"
          icon={<ClipboardList className="h-4 w-4" />}
        >
          <div
            className="space-y-2"
            role="radiogroup"
            aria-label="เลือกประเภทแบบฝึก"
          >
            {PRACTICE_TYPES.map((pt) => {
              const isSelected = practiceType === pt.value
              return (
                <button
                  key={pt.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => updatePracticeType(pt.value)}
                  className={`option-card ${
                    isSelected ? "option-card-selected" : ""
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-ink-secondary"
                    }`}
                    aria-hidden="true"
                  >
                    {pt.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        isSelected ? "text-primary" : "text-ink-DEFAULT"
                      }`}
                    >
                      {pt.label}
                    </p>
                    <p className="text-xs leading-5 text-ink-secondary">
                      {pt.labelThai}
                    </p>
                  </div>
                  {isSelected && (
                    <span
                      className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white"
                      aria-hidden="true"
                    >
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 6l2.5 2.5 4.5-5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </SectionCard>
      </div>

      {/* ── Count Preview ── */}
      <div className="mt-4">
        {categoryWords.length > 0 ? (
          <div className="rounded-xl border border-primary/20 bg-primary-soft p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-primary">
                  คำศัพท์ที่ตรงเงื่อนไข
                </p>
                <p className="mt-0.5 text-3xl font-bold text-primary">
                  {categoryWords.length.toLocaleString()}{" "}
                  <span className="text-lg font-semibold">คำ</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/20">
                    {categoryDisplayLabel}
                  </span>
                  <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-ink-secondary ring-1 ring-border">
                    {practiceTypeLabel}
                  </span>
                  <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-ink-secondary ring-1 ring-border">
                    สุ่ม {Math.min(20, categoryWords.length)} ข้อ
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state bg-slate-50 p-6">
            <p className="text-sm font-semibold text-ink-secondary">
              หมวดนี้ยังไม่มีคำศัพท์
            </p>
            <p className="mt-1 text-xs text-ink-secondary">
              ลองเลือกหมวดหมู่อื่นแล้วลองใหม่อีกครั้ง
            </p>
          </div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          id="quiz-start-btn"
          onClick={handleStart}
          disabled={categoryWords.length === 0}
          variant="primary"
          className="w-full sm:flex-1 sm:max-w-xs"
          aria-label={
            categoryWords.length > 0
              ? `เริ่มฝึก ${Math.min(20, categoryWords.length)} ข้อ`
              : "ไม่มีคำศัพท์ให้ฝึก"
          }
        >
          🚀 เริ่มฝึก{" "}
          {categoryWords.length > 0
            ? `${Math.min(20, categoryWords.length)} ข้อ`
            : ""}
        </Button>

        <Button
          id="quiz-reset-btn"
          onClick={resetFilters}
          disabled={!isAnyFilterActive}
          variant="secondary"
          className="w-full sm:w-auto"
          aria-label="ล้างตัวกรองทั้งหมด"
        >
          ล้างตัวกรอง
        </Button>
      </div>
    </div>
  )
}
