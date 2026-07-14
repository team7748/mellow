import { ArrowLeft, Lightbulb, AlertTriangle, Info, MessageCircle, GraduationCap } from "lucide-react"
import { PageContainer } from "../components/layout/PageContainer"
import { Button } from "../components/ui/Button"
import { SpeakButton } from "../components/ui/SpeakButton"
import { VocabIcon } from "../components/ui/VocabIcon"
import { getVocabularyById } from "../utils/vocabulary"

type WordDetailPageProps = {
  wordId: string
  onBack: () => void
}

const fallbackText = "กำลังรวบรวมข้อมูลในส่วนนี้ครับ"

function hasText(value?: string | null | unknown[]) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value && typeof value === 'string' && value.trim().length > 0)
}

function TextValue({ value }: { value?: string | null }) {
  return <>{hasText(value) ? value : fallbackText}</>
}

function DetailSection({
  children,
  title,
  icon,
}: {
  children: React.ReactNode
  title: string
  icon?: React.ReactNode
}) {
  return (
    <section className="bg-card rounded-[1.25rem] p-5 sm:p-6 border border-border shadow-[0_2px_8px_rgba(4,120,87,0.02)] transition-shadow hover:shadow-[0_4px_16px_rgba(4,120,87,0.04)]">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {icon}
        <h2 className="text-lg font-bold text-ink-DEFAULT">{title}</h2>
      </div>
      <div className="mt-4 text-base leading-7 text-ink-DEFAULT">{children}</div>
    </section>
  )
}

export function WordDetailPage({ onBack, wordId }: WordDetailPageProps) {
  const word = getVocabularyById(wordId)

  if (!word) {
    return (
      <PageContainer className="py-8 sm:py-10">
        <Button className="mb-6" variant="secondary" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
          กลับไปคลังคำศัพท์
        </Button>
        <section className="empty-state">
          <h1 className="text-2xl font-bold text-ink-DEFAULT">ไม่พบข้อมูลคำศัพท์ที่คุณตามหา</h1>
          <p className="mt-3 text-ink-secondary">{fallbackText}</p>
        </section>
      </PageContainer>
    )
  }

  const categories = word.category ?? []
  
  const isAdvanced = word.cefr === "C1" || word.cefr === "C2"
  const cefrLabel = isAdvanced ? `${word.cefr} (${word.cefr === 'C1' ? 'Advanced' : 'Expert'})` : word.cefr

  return (
    <PageContainer className="py-4 sm:py-6 space-y-6">
      <div className="sticky top-0 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 py-3 bg-card/90 backdrop-blur-md border-b border-border shadow-sm mb-2">
        <Button variant="secondary" onClick={onBack} className="w-auto shadow-sm">
          <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
          กลับไปคลังคำศัพท์
        </Button>
      </div>

      {/* Section 1: Header */}
      <section className="bg-card rounded-[1.25rem] p-5 sm:p-6 border border-border shadow-[0_2px_8px_rgba(4,120,87,0.02)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              {word.icon && word.icon !== "CircleHelp" && (
                <VocabIcon
                  className="shrink-0 text-primary"
                  fallbackIcon={word.fallbackIcon}
                  icon={word.icon}
                  label={word.word}
                  size={42}
                />
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-extrabold text-ink-DEFAULT sm:text-5xl">
                    {word.word}
                  </h1>
                  <SpeakButton
                    label={`ฟังเสียง ${word.word}`}
                    text={word.word}
                  />
                </div>
                {(hasText(word.ipa) || hasText(word.thaiReading)) && (
                  <p className="mt-2 text-lg text-ink-secondary">
                    {word.ipa && <span className="mr-3 font-mono">{word.ipa}</span>}
                    {word.thaiReading && <span>{word.thaiReading}</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 max-w-[300px] justify-start sm:justify-end">
            <span className="inline-flex items-center rounded-md border border-border bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-ink-secondary">
              {word.partOfSpeechStandard || word.partOfSpeech}
            </span>
            <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold ${isAdvanced ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-primary-soft text-primary border-primary/20'}`}>
              {cefrLabel}
            </span>
            {hasText(word.frequency) && (
              <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                {word.frequency}
              </span>
            )}
            {categories.map((cat) => (
              <span key={cat} className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                {cat}
              </span>
            ))}
            {word.tags?.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-md border border-border bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-ink-secondary">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Meanings */}
      <section className="grid gap-4 md:grid-cols-2">
        <DetailSection title="ความหมาย">
          <p className="text-2xl font-bold text-primary leading-10">
            {word.thaiMeaning}
          </p>
        </DetailSection>
        {hasText(word.simpleMeaning) && (
          <DetailSection title="คำอธิบาย (ภาษาอังกฤษ)">
            <p className="text-lg text-ink-DEFAULT">{word.simpleMeaning}</p>
          </DetailSection>
        )}
      </section>


      {/* Section 4: Example Sentences */}
      {(hasText(word.additionalExamples) || hasText(word.example) || hasText(word.contextExamples)) && (
        <DetailSection title="ประโยคตัวอย่าง">
          <ul className="space-y-4">
            {/* C1/C2 words: use contextExamples if no additionalExamples */}
            {!hasText(word.additionalExamples) && hasText(word.contextExamples) &&
              word.contextExamples!.map((ctx, idx) => (
                <li key={idx} className="rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 shrink-0">
                      <SpeakButton text={ctx.exampleEn} className="hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink-DEFAULT text-lg leading-relaxed">{ctx.exampleEn}</p>
                      {hasText(ctx.exampleThai) && (
                        <p className="mt-2 text-ink-secondary text-base leading-relaxed">{ctx.exampleThai}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))
            }



            {/* Fallback to old single example */}
            {hasText(word.example) && !hasText(word.additionalExamples) && !hasText(word.contextExamples) && (
              <li className="rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0"><SpeakButton text={word.example} className="hover:scale-110 transition-transform" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-ink-DEFAULT text-lg leading-relaxed">{word.example}</p>
                    {hasText(word.exampleThai) && (
                      <p className="mt-2 text-ink-secondary text-base leading-relaxed">{word.exampleThai}</p>
                    )}
                  </div>
                </div>
              </li>
            )}

            {/* New additionalExamples array */}
            {word.additionalExamples?.map((ex, idx) => (
              <li key={idx} className="rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0"><SpeakButton text={ex.sentenceEn} className="hover:scale-110 transition-transform" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-ink-DEFAULT text-lg leading-relaxed">{ex.sentenceEn}</p>
                    {hasText(ex.sentenceThai) && (
                      <p className="mt-2 text-ink-secondary text-base leading-relaxed">{ex.sentenceThai}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {/* Section 4.5: Usage Notes */}
      {word.usageNotes && (
        <DetailSection title="คำแนะนำการใช้คำนี้" icon={<Lightbulb className="h-5 w-5 text-amber-500" />}>
          <div className="space-y-6">
            {word.usageNotes.howToUse && (
              <div className="flex gap-3 items-start group">
                <div className="mt-0.5 shrink-0 rounded-lg bg-teal-50 p-2 text-teal-600 ring-1 ring-teal-100/50 transition-colors group-hover:bg-teal-100">
                  <Info className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-bold text-ink-DEFAULT">ใช้ยังไง</p>
                  <p className="mt-1 text-ink-secondary leading-relaxed">{word.usageNotes.howToUse}</p>
                </div>
              </div>
            )}
            
            {word.usageNotes.commonSituation && (
              <div className="flex gap-3 items-start group">
                <div className="mt-0.5 shrink-0 rounded-lg bg-indigo-50 p-2 text-indigo-600 ring-1 ring-indigo-100/50 transition-colors group-hover:bg-indigo-100">
                  <MessageCircle className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-bold text-ink-DEFAULT">ใช้บ่อยในสถานการณ์ไหน</p>
                  <p className="mt-1 text-ink-secondary leading-relaxed">{word.usageNotes.commonSituation}</p>
                </div>
              </div>
            )}

            {word.usageNotes.formality && (
              <div className="flex gap-3 items-start group">
                <div className="mt-0.5 shrink-0 rounded-lg bg-violet-50 p-2 text-violet-600 ring-1 ring-violet-100/50 transition-colors group-hover:bg-violet-100">
                  <GraduationCap className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-bold text-ink-DEFAULT">ระดับภาษา</p>
                  <p className="mt-1 text-ink-secondary leading-relaxed">{word.usageNotes.formality}</p>
                </div>
              </div>
            )}

            {word.usageNotes.warning && (
              <div className="flex gap-3 items-start group">
                <div className="mt-0.5 shrink-0 rounded-lg bg-rose-50 p-2 text-rose-600 ring-1 ring-rose-100/50 transition-colors group-hover:bg-rose-100">
                  <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-rose-700">ข้อควรระวัง</p>
                  <div className="mt-1.5 rounded-lg bg-rose-50/50 border border-rose-100 p-3 text-rose-800 leading-relaxed shadow-sm">
                    {word.usageNotes.warning}
                  </div>
                </div>
              </div>
            )}

            {word.usageNotes.thaiLearnerTip && (
              <div className="flex gap-3 items-start group">
                <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-xs font-black text-sky-600 ring-1 ring-sky-100/50 transition-colors group-hover:bg-sky-100">
                  TH
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sky-700">เคล็ดลับสำหรับคนไทย</p>
                  <div className="mt-1.5 rounded-lg bg-sky-50/50 border border-sky-100 p-3 text-sky-800 leading-relaxed shadow-sm">
                    {word.usageNotes.thaiLearnerTip}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DetailSection>
      )}

      {/* Layout for Q&A and Collocations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 5: Q&A */}
        {hasText(word.qaExamples) && (
          <DetailSection title="ลองใช้ตอบคำถาม (Q&A)">
            <div className="space-y-4">
              {word.qaExamples!.map((qa, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
                  <div className="flex gap-3">
                    <span className="font-bold text-primary text-lg">Q:</span>
                    <div className="flex-1">
                      <p className="font-semibold text-ink-DEFAULT text-base">{qa.questionEn}</p>
                      <p className="text-sm text-ink-secondary mb-3">{qa.questionThai}</p>
                    </div>
                    <SpeakButton text={qa.questionEn} className="hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex gap-3 mt-3 pt-3 border-t border-border">
                    <span className="font-bold text-primary text-lg">A:</span>
                    <div className="flex-1">
                      <p className="font-semibold text-ink-DEFAULT text-base">{qa.answerEn}</p>
                      <p className="text-sm text-ink-secondary">{qa.answerThai}</p>
                    </div>
                    <SpeakButton text={qa.answerEn} className="hover:scale-110 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Section 6: Collocations */}
        {hasText(word.collocations) && (
          <DetailSection title="คำที่มักใช้คู่กัน">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {word.collocations!.map((col, idx) => (
                <div key={idx} className="flex flex-col justify-center rounded-lg bg-slate-100/70 px-4 py-2.5 text-sm transition-colors hover:bg-slate-200/70">
                  <span className="font-bold text-ink-DEFAULT text-base">{col.text}</span>
                  {col.meaningThai && (
                    <span className="mt-0.5 font-medium text-ink-secondary">{col.meaningThai}</span>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>
        )}
      </div>

      {/* Section 7: Confusing Words / Usage Tips */}
      {(hasText(word.confusingWords) || hasText(word.thaiUsageTip)) && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-amber-700 font-bold mb-4">
            <AlertTriangle className="w-5 h-5" />
            <h2>ระวังใช้ผิด</h2>
          </div>
          
          {hasText(word.thaiUsageTip) && (
            <p className="text-amber-900 mb-4">{word.thaiUsageTip}</p>
          )}

          {hasText(word.confusingWords) && (
            <ul className="space-y-3">
              {word.confusingWords!.map((cw, idx) => (
                <li key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-sm">
                  <span className="rounded border border-amber-100 bg-card px-2 py-0.5 font-bold text-ink-DEFAULT">{cw.word}</span>
                  <span className="text-amber-900 font-semibold">= {cw.meaningThai}</span>
                  <span className="text-amber-700 hidden sm:inline">-</span>
                  <span className="text-amber-700">{cw.differenceThai}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Section 8: Memory Tip */}
      {hasText(word.memoryTip) && (
        <div className="memory-tip-panel flex items-start gap-4 rounded-xl border border-primary/20 bg-primary-soft p-5">
          <div className="rounded-lg bg-card p-2 text-primary ring-1 ring-primary/20">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h3 className="mb-1 font-bold text-primary">จำง่ายๆ</h3>
            <p className="text-lg font-medium leading-relaxed text-ink-DEFAULT">{word.memoryTip}</p>
          </div>
        </div>
      )}

    </PageContainer>
  )
}
