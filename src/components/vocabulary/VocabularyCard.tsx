import { ArrowRight } from "lucide-react"
import type { VocabularyItem, WordStatus } from "../../types/vocabulary"
import { SpeakButton } from "../ui/SpeakButton"
import { VocabIcon } from "../ui/VocabIcon"

type VocabularyCardProps = {
  vocabulary: VocabularyItem
  status: WordStatus
  onViewDetails?: (id: string) => void
}

const statusLabels: Record<WordStatus, string> = {
  new: "คำใหม่",
  learning: "กำลังเรียน",
  review: "ต้องทบทวน",
  mastered: "จำได้มั่นใจ",
}

const statusStyles: Record<WordStatus, string> = {
  new: "text-ink-secondary bg-page border border-border",
  learning: "text-mission-orange bg-mission-orangeBg border border-mission-orange/20",
  review: "text-mission-blue bg-mission-blueBg border border-mission-blue/20",
  mastered: "text-primary bg-primary-soft border border-primary/20",
}

const levelLabels: Record<number, string> = {
  1: "Lv.1",
  2: "Lv.2",
  3: "Lv.3",
}

export function VocabularyCard({
  vocabulary,
  status,
  onViewDetails,
}: VocabularyCardProps) {
  const categories = vocabulary.category ?? []
  const scenarioLabel = categories.length > 0
  return (
    <article
      aria-label={`${vocabulary.word} vocabulary card`}
      className="group bg-card rounded-2xl border border-border flex h-full min-w-0 flex-col p-4 sm:p-6 transition-all duration-300 motion-safe:hover:-translate-y-1 shadow-sm hover:shadow-md hover:border-primary/30 active:scale-[0.99] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-500"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            {/* Vocab icon (small, subtle) */}
            {vocabulary.icon && vocabulary.icon !== "CircleHelp" && (
              <VocabIcon
                className="shrink-0 transition-colors duration-300 text-ink-secondary/50 group-hover:text-primary/70"
                fallbackIcon={vocabulary.fallbackIcon}
                icon={vocabulary.icon}
                label={vocabulary.word}
                size={22}
              />
            )}
            <h2 className="min-w-0 break-words text-3xl font-bold leading-none text-ink-dark">
              {vocabulary.word}
            </h2>
            <SpeakButton
              className="min-h-11 min-w-11"
              label={`ฟังเสียง ${vocabulary.word}`}
              text={vocabulary.word}
            />
          </div>
          <p className="mt-2 text-lg font-semibold leading-7 text-ink-DEFAULT">
            {vocabulary.thaiMeaning}
          </p>
          <p className="mt-1 text-sm font-medium leading-6 text-ink-secondary">
            {vocabulary.ipa}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider max-w-full self-start break-words ${statusStyles[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      <div className="mt-5 flex min-w-0 flex-wrap items-center gap-2.5 text-[13px] font-semibold tracking-wide">
        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-primary font-bold bg-primary-soft">
          {vocabulary.cefr}
        </span>
        {vocabulary.partOfSpeechStandard && (
          <>
            <span className="text-border">&bull;</span>
            <span className="text-ink-secondary">
              {vocabulary.partOfSpeechStandard}
            </span>
          </>
        )}
        {vocabulary.level && (
          <>
            <span className="text-border">&bull;</span>
            <span className="text-ink-secondary">
              {levelLabels[vocabulary.level] ?? `Lv.${vocabulary.level}`}
            </span>
          </>
        )}
        <span className="text-border">&bull;</span>
        <span className="text-primary/70 max-w-full break-words">
          {scenarioLabel}
        </span>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-semibold text-ink-secondary">ตัวอย่าง</p>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-ink-DEFAULT">
          {vocabulary.example}
        </p>
      </div>

      <button
        className="mt-5 inline-flex min-h-11 w-full max-w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-primary transition duration-150 hover:border-primary/20 hover:bg-primary-soft focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98]"
        type="button"
        onClick={() => onViewDetails?.(vocabulary.id)}
      >
        ดูรายละเอียด
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </article>
  )
}
