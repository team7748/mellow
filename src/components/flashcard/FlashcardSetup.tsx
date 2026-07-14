import {
  ArrowLeft,
  BookOpen,
  Target,
  Filter,
  List,
  RefreshCw,
  Search,
  Shuffle,
  Zap,
  CheckSquare,
  BookText,
  GraduationCap,
  Layers,
  Play,
} from "lucide-react"
import { useMemo } from "react"
import {
  DEFAULT_MODE,
  type SetupFilters,
  type TrainingMode,
  useUnifiedFlashcardSetup,
} from "../../hooks/useUnifiedFlashcardSetup"
import type { CefrLevel, PartOfSpeech, VocabCategory } from "../../types/vocabulary"
import {
  getAllCategories,
  getAllPartOfSpeech,
  getAllVocabulary,
} from "../../utils/vocabulary"
import { getGrammarTopics } from "../../data/grammar/registry"
import { Button } from "../ui/Button"
import { SrsToggle } from "../SrsToggle"
import { PageHeader } from "../layout/PageHeader"
import { getSrsStatusInfo } from "../../utils/srsService"
import type { UnifiedFlashcard } from "../../types/flashcardItem"

// ─── Constants ────────────────────────────────────────────────────────────────

const CEFR_LEVELS: Array<"all" | CefrLevel> = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

const STATUS_OPTIONS: Array<{
  value: SetupFilters["status"]
  label: string
  requiresProgress: boolean
  isSrs?: boolean
}> = [
  { value: "all", label: "ทั้งหมด", requiresProgress: false },
  // Normal mode statuses
  { value: "new", label: "ใหม่", requiresProgress: true, isSrs: false },
  { value: "learning", label: "กำลังเรียน", requiresProgress: true, isSrs: false },
  { value: "mastered", label: "จำได้แล้ว", requiresProgress: true, isSrs: false },
  { value: "forgot", label: "จำไม่ได้", requiresProgress: true, isSrs: false },
  // SRS mode statuses
  { value: "srs-due-now", label: "ควรทบทวนตอนนี้", requiresProgress: false, isSrs: true },
  { value: "srs-due-today", label: "ควรทบทวนวันนี้", requiresProgress: false, isSrs: true },
  { value: "srs-forgot", label: "ยังจำไม่ได้", requiresProgress: false, isSrs: true },
]

const GRAMMAR_TENSE_OPTIONS: Array<{ value: "all" | "present" | "past" | "future", label: string }> = [
  { value: "all", label: "ทุก Tense" },
  { value: "present", label: "Present (ปัจจุบัน)" },
  { value: "past", label: "Past (อดีต)" },
  { value: "future", label: "Future (อนาคต)" },
]

const TRAINING_MODES: Array<{
  value: TrainingMode
  label: string
  labelThai: string
  icon: React.ReactNode
}> = [
  { value: "inOrder", label: "In Order", labelThai: "ฝึกตามลำดับเดิม", icon: <List className="h-4 w-4" /> },
  { value: "shuffle", label: "Shuffle", labelThai: "สุ่มลำดับการ์ด", icon: <Shuffle className="h-4 w-4" /> },
  { value: "newOnly", label: "New Words", labelThai: "คำศัพท์ใหม่เท่านั้น", icon: <Zap className="h-4 w-4" /> },
  { value: "learningOnly", label: "Learning", labelThai: "คำที่กำลังเรียน", icon: <BookOpen className="h-4 w-4" /> },
  { value: "reviewForgot", label: "Review", labelThai: "ทบทวนคำที่จำไม่ได้", icon: <RefreshCw className="h-4 w-4" /> },
  { value: "custom-selection", label: "Custom", labelThai: "เลือกเอง (สูงสุด 50)", icon: <CheckSquare className="h-4 w-4" /> },
]

const CATEGORY_THAI: Partial<Record<VocabCategory, string>> = {
  "Daily Life": "ชีวิตประจำวัน", Bedroom: "ห้องนอน", Bathroom: "ห้องน้ำ", Kitchen: "ครัว",
  "Food & Drinks": "อาหารและเครื่องดื่ม", "Body & Health": "ร่างกายและสุขภาพ", Clothes: "เสื้อผ้า",
  "People & Family": "คนและครอบครัว", "School & Work": "โรงเรียนและงาน", Places: "สถานที่",
  Travel: "การเดินทาง", "Shopping & Money": "การช้อปปิ้งและเงิน", Feelings: "ความรู้สึก",
  Objects: "สิ่งของ", "Basic Actions": "การกระทำพื้นฐาน", "Nature & Animals": "ธรรมชาติและสัตว์", Technology: "เทคโนโลยี"
}
const POS_THAI: Partial<Record<PartOfSpeech, string>> = {
  noun: "คำนาม", verb: "คำกริยา", adjective: "คำคุณศัพท์", adverb: "กริยาวิเศษณ์", preposition: "บุพบท", pronoun: "สรรพนาม", conjunction: "สันธาน", phrase: "วลี"
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="surface-section">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">{icon}</span>
        <h2 className="text-sm font-bold text-ink-DEFAULT">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function FilterRow({ label, htmlFor, children }: { label: string, htmlFor?: string, children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-ink-secondary">{label}</label>
      {children}
    </div>
  )
}

function ChipButton({ label, isSelected, onClick, disabled, title }: { label: string, isSelected: boolean, onClick: () => void, disabled?: boolean, title?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`ui-chip text-xs ${isSelected ? "ui-chip-selected" : ""}`}>
      {label}
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

type FlashcardSetupProps = {
  onStart: (cards: UnifiedFlashcard[]) => void
  onBackToVocabulary: () => void
}

export function FlashcardSetup({ onStart, onBackToVocabulary }: FlashcardSetupProps) {
  const {
    filters, mode, setMode, updateFilter, resetFilters,
    baseFilteredCards, activeCards, startSession, startRandom20Session,
    customSelectedIds, toggleCustomSelection, selectAllCustomSelection, clearCustomSelection,
    srsEnabled, setSrsEnabled, isLoadingGrammar
  } = useUnifiedFlashcardSetup()

  const categories = useMemo(() => getAllCategories(), [])
  const posOptions = useMemo(() => getAllPartOfSpeech(), [])
  const grammarTopics = useMemo(() => getGrammarTopics(), [])
  const categoryWordCounts = useMemo(() => {
    const counts: Partial<Record<VocabCategory, number>> = {}
    for (const word of getAllVocabulary()) {
      for (const cat of word.category ?? []) { counts[cat] = (counts[cat] ?? 0) + 1 }
    }
    return counts
  }, [])

  const isAnyFilterActive = filters.category !== "all" || filters.cefr !== "all" || filters.partOfSpeech !== "all" || filters.status !== "all" || filters.searchKeyword.trim() !== "" || filters.grammarTense !== "all" || filters.grammarTopicId !== "all" || mode !== DEFAULT_MODE

  const filterTags: string[] = []
  if (filters.source === "vocabulary" || filters.source === "mixed") {
    if (filters.category !== "all") filterTags.push(CATEGORY_THAI[filters.category] ?? filters.category)
    if (filters.cefr !== "all") filterTags.push(`CEFR: ${filters.cefr}`)
    if (filters.partOfSpeech !== "all") filterTags.push(POS_THAI[filters.partOfSpeech] ?? filters.partOfSpeech)
  }
  if (filters.source === "grammar" || filters.source === "mixed") {
    if (filters.grammarTense !== "all") filterTags.push(`Tense: ${filters.grammarTense}`)
    if (filters.grammarTopicId !== "all") filterTags.push(`Topic: ${grammarTopics.find(t=>t.id===filters.grammarTopicId)?.name}`)
  }
  if (filters.status !== "all") {
    const statusLabel = STATUS_OPTIONS.find((o) => o.value === filters.status)?.label ?? filters.status
    filterTags.push(`สถานะ: ${statusLabel}`)
  }
  if (filters.searchKeyword.trim()) filterTags.push(`"${filters.searchKeyword.trim()}"`)

  function handleStart() {
    const cards = startSession()
    if (cards.length > 0) onStart(cards)
  }

  function handleRandom20() {
    const cards = startRandom20Session()
    if (cards.length > 0) onStart(cards)
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      {/* ── Page Header ── */}
      <PageHeader
        subtitle="การฝึกคำศัพท์"
        title="แฟลชการ์ด"
        description="ตั้งค่าชุดคำศัพท์ รูปแบบการฝึก และตัวเลือกต่าง ๆ ก่อนเริ่มฝึก"
      />

      <div className="mb-6 flex flex-col md:flex-row md:items-stretch justify-between gap-4">
        {/* Source Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-lg w-full md:w-auto shrink-0">
          {[
            { id: "vocabulary", label: "Vocabulary", icon: <BookText className="w-4 h-4 mr-2" /> },
            { id: "grammar", label: "Grammar", icon: <GraduationCap className="w-4 h-4 mr-2" /> },
            { id: "mixed", label: "Mixed Mode", icon: <Layers className="w-4 h-4 mr-2" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => updateFilter("source", tab.id as any)}
              className={`flex-1 md:flex-none flex items-center justify-center px-4 sm:px-6 rounded-lg text-sm font-bold transition-all ${
                filters.source === tab.id ? "bg-white text-primary shadow-sm ring-1 ring-black/5" : "text-ink-secondary hover:text-ink-DEFAULT hover:bg-black/5"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <SrsToggle enabled={srsEnabled} onChange={setSrsEnabled} className="w-full md:max-w-[340px]" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        {/* ── LEFT COLUMN: Filters ── */}
        <div className="flex flex-col gap-4">
          <SectionCard title={`ตัวกรอง (${filters.source === "vocabulary" ? "คำศัพท์" : filters.source === "grammar" ? "แกรมม่า" : "ผสม"})`} icon={<Filter className="h-4 w-4" />}>
            <div className="space-y-4">
              <FilterRow label="ค้นหา" htmlFor="fc-search">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
                  <input id="fc-search" type="text" placeholder="ค้นหาเนื้อหา..." value={filters.searchKeyword} onChange={(e) => updateFilter("searchKeyword", e.target.value)} className="ui-control pl-9" />
                </div>
              </FilterRow>

              {(filters.source === "vocabulary" || filters.source === "mixed") && (
                <>
                  <FilterRow label="หมวดหมู่คำศัพท์" htmlFor="fc-category">
                    <select id="fc-category" value={filters.category} onChange={(e) => updateFilter("category", e.target.value as any)} className="ui-control">
                      <option value="all">ทุกหมวดหมู่</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{`${CATEGORY_THAI[cat] ?? cat} — ${(categoryWordCounts[cat] ?? 0).toLocaleString()} คำ`}</option>
                      ))}
                    </select>
                  </FilterRow>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FilterRow label="ระดับ CEFR">
                      <select value={filters.cefr} onChange={(e) => updateFilter("cefr", e.target.value as any)} className="ui-control">
                        {CEFR_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl === "all" ? "ทั้งหมด" : lvl}</option>)}
                      </select>
                    </FilterRow>
                    <FilterRow label="ชนิดของคำ">
                      <select value={filters.partOfSpeech} onChange={(e) => updateFilter("partOfSpeech", e.target.value as any)} className="ui-control">
                        <option value="all">ทั้งหมด</option>
                        {posOptions.map((pos) => <option key={pos} value={pos}>{POS_THAI[pos] ?? pos}</option>)}
                      </select>
                    </FilterRow>
                  </div>
                </>
              )}

              {(filters.source === "grammar" || filters.source === "mixed") && (
                <>
                  <FilterRow label="Grammar Tense">
                    <div className="flex flex-wrap gap-2">
                      {GRAMMAR_TENSE_OPTIONS.map((opt) => (
                        <ChipButton key={opt.value} label={opt.label} isSelected={filters.grammarTense === opt.value} onClick={() => updateFilter("grammarTense", opt.value as any)} />
                      ))}
                    </div>
                  </FilterRow>
                  <FilterRow label="หัวข้อ Grammar" htmlFor="fc-topic">
                    <select id="fc-topic" value={filters.grammarTopicId} onChange={(e) => updateFilter("grammarTopicId", e.target.value)} className="ui-control">
                      <option value="all">ทุกหัวข้อ</option>
                      {grammarTopics.map((topic) => (
                        <option key={topic.id} value={topic.id}>{topic.name} ({topic.nameThai})</option>
                      ))}
                    </select>
                  </FilterRow>
                </>
              )}

              <FilterRow label="สถานะการจำ (SRS/Progress)">
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter((opt) => opt.isSrs === undefined || opt.isSrs === srsEnabled).map((opt) => (
                    <ChipButton
                      key={opt.value} label={opt.label} isSelected={filters.status === opt.value}
                      onClick={() => updateFilter("status", opt.value)}
                      disabled={false}
                    />
                  ))}
                </div>
              </FilterRow>
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN: Mode ── */}
        <div className="flex flex-col gap-4">
          <SectionCard title="รูปแบบการฝึก" icon={<Zap className="h-4 w-4" />}>
            <div className="space-y-2">
              {TRAINING_MODES.map((m) => (
                <button
                  key={m.value} onClick={() => setMode(m.value)}
                  role="radio"
                  aria-checked={mode === m.value}
                  aria-label={m.value === "reviewForgot" ? `${m.label} ${m.labelThai} ฝึกเฉพาะคำที่จำไม่ได้` : undefined}
                  className={`option-card ${mode === m.value ? "option-card-selected" : ""}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${mode === m.value ? "bg-primary text-white" : "bg-slate-100 text-ink-secondary"}`}>{m.icon}</span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className={`text-sm font-semibold ${mode === m.value ? "text-primary" : "text-ink-DEFAULT"}`}>{m.label}</p>
                    <p className="text-xs text-ink-secondary">{m.labelThai}</p>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {mode === "custom-selection" && (
        <div className="mt-4 surface-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-ink-DEFAULT">เลือกการ์ดที่ต้องการฝึก</h3>
                  <p className={`text-sm font-medium ${customSelectedIds.length === 50 ? 'text-rose-600' : 'text-ink-secondary'}`}>
                    {customSelectedIds.length === 50 ? "เลือกครบ 50 การ์ดแล้ว" : `เลือกแล้ว ${customSelectedIds.length} / 50 การ์ด`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={selectAllCustomSelection} className="text-sm shrink-0" disabled={baseFilteredCards.length === 0}>
                    เลือกทั้งหมดจากผลลัพธ์
                  </Button>
                  <Button variant="secondary" onClick={clearCustomSelection} className="text-sm shrink-0 text-rose-600 border-rose-200" disabled={customSelectedIds.length === 0}>
                    ล้างทั้งหมด
                  </Button>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-inner">
                {baseFilteredCards.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {baseFilteredCards.map((card) => {
                      const isSelected = customSelectedIds.includes(card.id);
                      const isDisabled = !isSelected && customSelectedIds.length >= 50;
                      return (
                        <label key={card.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${isSelected ? "border-primary bg-primary-soft shadow-sm" : isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 hover:border-border-hover"}`}>
                          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border text-primary" checked={isSelected} disabled={isDisabled} onChange={() => toggleCustomSelection(card.id)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${card.type === 'vocabulary' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{card.type.toUpperCase()}</span>
                              {srsEnabled && <span className="text-[10px] bg-primary-active text-ink-dark px-1.5 py-0.5 rounded font-bold">{getSrsStatusInfo(card.patternId || card.id).statusLabel}</span>}
                            </div>
                            <p className="text-sm font-semibold text-ink-DEFAULT line-clamp-2">{card.front}</p>
                            <p className="text-xs text-ink-secondary line-clamp-1 mt-0.5">{card.back}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : <p className="p-8 text-center text-sm text-ink-secondary">ไม่พบการ์ดตามเงื่อนไขที่กรอง</p>}
              </div>
            </div>
          )}
      {/* ── Count Preview ── */}
      <div className="mt-4">
        {isLoadingGrammar ? (
          <div className="empty-state p-6 bg-slate-50 border border-border rounded-xl">
            <p className="text-sm font-semibold text-ink-secondary">กำลังโหลดข้อมูล Grammar...</p>
          </div>
        ) : activeCards.length > 0 ? (
          <div className="rounded-xl border border-primary/20 bg-primary-soft p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-primary">คำศัพท์ที่ตรงเงื่อนไข</p>
                <p className="mt-0.5 text-3xl font-bold text-primary">
                  {activeCards.length.toLocaleString()} <span className="text-lg font-semibold">คำ</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {filterTags.length > 0 ? (
                    filterTags.map((tag, index) => (
                      <span key={tag} className={`rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold ${index === 0 ? "text-primary ring-primary/20" : "text-ink-secondary ring-border"} ring-1`}>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/20">ทั้งหมด</span>
                  )}
                  {srsEnabled && (
                    <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-ink-secondary ring-1 ring-border">
                      ระบบ SRS
                    </span>
                  )}
                  <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-ink-secondary ring-1 ring-border">
                    {TRAINING_MODES.find((m) => m.value === mode)?.labelThai ?? mode}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state p-6 bg-slate-50 border border-border rounded-xl">
            <p className="text-sm font-bold text-ink-secondary">ไม่พบคำศัพท์ที่ตรงกับเงื่อนไข</p>
            <p className="mt-1 text-xs text-ink-secondary">ลองปรับลดตัวกรองเพื่อให้พบคำศัพท์มากขึ้น</p>
          </div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          onClick={handleStart}
          disabled={mode === "custom-selection" ? customSelectedIds.length === 0 : activeCards.length === 0}
          variant="primary"
          className="w-full sm:flex-1 py-3 text-base shadow-sm rounded-xl transition-all duration-300"
        >
          <Play className="w-5 h-5 mr-2 fill-current" />
          {srsEnabled ? "เริ่มทบทวนด้วย SRS" : "เริ่มฝึกทันที"} {mode === "custom-selection" ? (customSelectedIds.length > 0 ? `(${customSelectedIds.length})` : "") : (activeCards.length > 0 ? `(${activeCards.length.toLocaleString()})` : "")}
        </Button>
        {activeCards.length > 20 && (
          <Button onClick={handleRandom20} variant="secondary" className="w-full sm:w-auto py-3 rounded-xl transition-all duration-300">
            <Shuffle className="w-5 h-5 mr-2" /> สุ่ม 20 การ์ด
          </Button>
        )}
        <Button onClick={resetFilters} disabled={!isAnyFilterActive} variant="secondary" className="w-full sm:w-auto py-3 rounded-xl transition-all duration-300">
          <RefreshCw className="w-5 h-5 mr-2" /> ล้างตัวกรอง
        </Button>
      </div>
    </div>
  )
}
