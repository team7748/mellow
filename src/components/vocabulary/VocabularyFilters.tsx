import type { CefrLevel, PartOfSpeech, VocabCategory, VocabLevel, WordStatus } from "../../types/vocabulary"
import { SearchInput } from "../ui/SearchInput"
import { VocabIcon } from "../ui/VocabIcon"
import { useState, useEffect } from "react"
import { categoryIconMap, categoryThaiLabels } from "../../data/categoryIconMap"
import { getAllCategories, getAllPartOfSpeech } from "../../utils/vocabulary"
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react"
type VocabularyFiltersProps = {
  searchTerm: string
  selectedCefr: "all" | CefrLevel
  selectedStatus: "all" | WordStatus
  selectedCategory: "all" | VocabCategory
  selectedPos: "all" | PartOfSpeech
  selectedLevel: "all" | VocabLevel
  onSearchChange: (value: string) => void
  onCefrChange: (value: "all" | CefrLevel) => void
  onStatusChange: (value: "all" | WordStatus) => void
  onCategoryChange: (value: "all" | VocabCategory) => void
  onPosChange: (value: "all" | PartOfSpeech) => void
  onLevelChange: (value: "all" | VocabLevel) => void
}

const cefrOptions: Array<"all" | CefrLevel> = [
  "all",
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
]

const statusOptions: Array<"all" | WordStatus> = [
  "all",
  "new",
  "learning",
  "review",
  "mastered",
]

const statusLabels: Record<"all" | WordStatus, string> = {
  all: "ทุกสถานะ",
  new: "คำใหม่",
  learning: "กำลังเรียน",
  review: "ต้องทบทวน",
  mastered: "จำได้มั่นใจ",
}

const posOptions: Array<"all" | PartOfSpeech> = [
  "all",
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "phrase",
]

const posLabels: Record<string, string> = {
  all: "ทุกชนิดคำ",
  noun: "Noun (คำนาม)",
  verb: "Verb (คำกริยา)",
  adjective: "Adjective (คำคุณศัพท์)",
  adverb: "Adverb (คำวิเศษณ์)",
  preposition: "Preposition (คำบุพบท)",
  pronoun: "Pronoun (สรรพนาม)",
  conjunction: "Conjunction (คำเชื่อม)",
  phrase: "Phrase (วลี)",
}

const levelOptions: Array<"all" | VocabLevel> = ["all", 1, 2, 3]

const levelLabels: Record<string, string> = {
  all: "ทุกระดับ",
  "1": "Level 1 — พื้นฐานมาก",
  "2": "Level 2 — ใช้บ่อย",
  "3": "Level 3 — เฉพาะบริบท",
}

const categoryChipBase =
  "ui-chip min-h-11 focus:ring-2"

export function VocabularyFilters({
  searchTerm,
  selectedCefr,
  selectedStatus,
  selectedCategory,
  selectedPos,
  selectedLevel,
  onSearchChange,
  onCefrChange,
  onStatusChange,
  onCategoryChange,
  onPosChange,
  onLevelChange,
}: VocabularyFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchTerm)

  useEffect(() => {
    setLocalSearch(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearchChange(localSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange, searchTerm])

  const hasActiveAdvancedFilters = selectedCefr !== "all" || selectedPos !== "all" || selectedLevel !== "all" || selectedStatus !== "all"

  return (
    <section className="surface-section">
      {/* Row 1: Search & Filter Toggle */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            label="ค้นหาคำศัพท์"
            placeholder="ค้นหา เช่น bed, นอน, Bedroom"
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            onClear={() => {
              setLocalSearch("")
              onSearchChange("")
            }}
          />
        </div>
        <div className="sm:self-end">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 min-h-11 rounded-lg border text-sm font-semibold transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
              hasActiveAdvancedFilters || showAdvanced
                ? "bg-primary border-primary text-primary"
                : "bg-card border-border text-ink-DEFAULT hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            ตัวกรองเพิ่มเติม
            {showAdvanced ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </button>
        </div>
      </div>

      {/* Row 2: Category chips */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-semibold text-ink-DEFAULT">หมวดหมู่</p>
        <div className="flex flex-wrap gap-2">
          <button
            className={`${categoryChipBase} ${
              selectedCategory === "all"
                ? "ui-chip-selected"
                : ""
            }`}
            type="button"
            aria-pressed={selectedCategory === "all"}
            onClick={() => onCategoryChange("all")}
          >
            ทั้งหมด
          </button>
          {getAllCategories().map((cat) => (
            <button
              key={cat}
              className={`${categoryChipBase} ${
                selectedCategory === cat
                  ? "ui-chip-selected"
                  : ""
              }`}
              type="button"
              aria-pressed={selectedCategory === cat}
              onClick={() => onCategoryChange(cat)}
            >
              <VocabIcon
                className="shrink-0"
                icon={categoryIconMap[cat] || "BookOpen"}
                size={14}
              />
              {categoryThaiLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Dropdowns (Advanced Filters) */}
      {showAdvanced && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4 pt-4 border-t border-border">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT">ระดับ CEFR</span>
          <select
            className="ui-control"
            value={selectedCefr}
            onChange={(event) => onCefrChange(event.target.value as "all" | CefrLevel)}
          >
            {cefrOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "ทุกระดับ" : option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT">ชนิดคำ</span>
          <select
            className="ui-control"
            value={selectedPos}
            onChange={(event) => onPosChange(event.target.value as "all" | PartOfSpeech)}
          >
            <option value="all">ทุกชนิดคำ</option>
            {getAllPartOfSpeech().map((option) => (
              <option key={option} value={option}>
                {posLabels[option] || option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT">ระดับความยาก</span>
          <select
            className="ui-control"
            value={selectedLevel === "all" ? "all" : String(selectedLevel)}
            onChange={(event) => {
              const val = event.target.value
              onLevelChange(val === "all" ? "all" : (Number(val) as VocabLevel))
            }}
          >
            {levelOptions.map((option) => (
              <option key={String(option)} value={String(option)}>
                {levelLabels[String(option)]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT">สถานะการเรียน</span>
          <select
            className="ui-control"
            value={selectedStatus}
            onChange={(event) => onStatusChange(event.target.value as "all" | WordStatus)}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {statusLabels[option]}
              </option>
            ))}
          </select>
        </label>
      </div>
      )}
    </section>
  )
}
