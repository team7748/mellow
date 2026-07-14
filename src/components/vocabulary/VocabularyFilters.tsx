import type { CefrLevel, PartOfSpeech, VocabCategory, VocabLevel, WordStatus } from "../../types/vocabulary"
import { SearchInput } from "../ui/SearchInput"
import { VocabIcon } from "../ui/VocabIcon"
import { Select } from "../ui/Select"
import { Chip } from "../ui/Chip"
import { useState, useEffect } from "react"
import { cn } from "../../utils/cn"
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
                ? "bg-primary border-primary text-white shadow-sm"
                : "bg-card border-border text-ink-DEFAULT hover:bg-page"
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
        <div className="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] sm:[mask-image:none]">
          <Chip
            variant={selectedCategory === "all" ? "selected" : "default"}
            onClick={() => onCategoryChange("all")}
            className="snap-start shrink-0 rounded-xl"
          >
            ทั้งหมด
          </Chip>
          {getAllCategories().map((cat) => (
            <Chip
              key={cat}
              variant={selectedCategory === cat ? "selected" : "default"}
              onClick={() => onCategoryChange(cat)}
              className="snap-start shrink-0 rounded-xl"
            >
              <VocabIcon
                className={cn("shrink-0 transition-colors duration-300", selectedCategory === cat ? 'text-primary' : 'text-ink-secondary/60 group-hover:text-primary')}
                icon={categoryIconMap[cat as import("../../types/vocabulary").VocabCategory] || "BookOpen"}
                size={16}
              />
              {categoryThaiLabels[cat] || cat}
            </Chip>
          ))}
        </div>
      </div>

      {/* Row 3: Dropdowns (Advanced Filters) */}
      {showAdvanced && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4 pt-4 border-t border-border">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT">ระดับ CEFR</span>
          <Select
            value={selectedCefr}
            onChange={(event) => onCefrChange(event.target.value as "all" | CefrLevel)}
          >
            {cefrOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "ทุกระดับ" : option}
              </option>
            ))}
          </Select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT">ชนิดคำ</span>
          <Select
            value={selectedPos}
            onChange={(event) => onPosChange(event.target.value as "all" | PartOfSpeech)}
          >
            <option value="all">ทุกชนิดคำ</option>
            {getAllPartOfSpeech().map((option) => (
              <option key={option} value={option}>
                {posLabels[option] || option}
              </option>
            ))}
          </Select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT">ระดับความยาก</span>
          <Select
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
          </Select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-DEFAULT">สถานะการเรียน</span>
          <Select
            value={selectedStatus}
            onChange={(event) => onStatusChange(event.target.value as "all" | WordStatus)}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {statusLabels[option]}
              </option>
            ))}
          </Select>
        </label>
      </div>
      )}
    </section>
  )
}
