import { useEffect, useState } from "react"
import { AlertCircle, ArrowLeft, Clock, ListChecks, Info, Check, X } from "lucide-react"
import { PageContainer } from "../components/layout/PageContainer"
import { Button } from "../components/ui/Button"
import { SpeakButton } from "../components/ui/SpeakButton"
import { GrammarPractice } from "../components/grammar/GrammarPractice"
import { PageHeader } from "../components/layout/PageHeader"
import { loadGrammarTopic } from "../data/grammar/loader"
import { useGrammarProgress } from "../hooks/useGrammarProgress"
import type { GrammarComparisonSide, GrammarRule, GrammarTopic } from "../types/grammar"
import { stopSpeech } from "../utils/speech"

type Props = { topicId: string; onBack: () => void }
type LoadState = { state: "loading" } | { state: "ready"; topic: GrammarTopic } | { state: "error"; error: "topic_not_found" | "load_failed" | "validation_failed" }

const ruleKeys = ["verbRules", "verbIngRules", "regularVerbRules", "pastParticipleRules"] as const

function getRules(topic: GrammarTopic): GrammarRule[] {
  return ruleKeys.flatMap((key) => topic[key] ?? [])
}

function isComparisonSide(value: unknown): value is GrammarComparisonSide {
  return typeof value === "object" && value !== null && "useThai" in value && "formula" in value && "example" in value && "translation" in value
}

function LessonSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="border-t border-primary/10 py-12 sm:py-16 first:border-t-0 first:pt-0">
      <h2 className="mb-8 text-3xl font-bold text-ink-dark tracking-tight flex items-center gap-3">
        <span className="w-1.5 h-8 bg-primary rounded-full"></span>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function GrammarLessonPage({ onBack, topicId }: Props) {
  const [loadState, setLoadState] = useState<LoadState>({ state: "loading" })
  const [showPractice, setShowPractice] = useState(false)
  const { markTopicViewed, markTopicCompleted } = useGrammarProgress()

  useEffect(() => {
    let active = true
    setLoadState({ state: "loading" })

    loadGrammarTopic(topicId).then((result) => {
      if (!active) return
      if (result.ok) {
        markTopicViewed(result.topic.id)
        setLoadState({ state: "ready", topic: result.topic })
      } else {
        setLoadState({ state: "error", error: result.error })
      }
    })

    return () => {
      active = false
      stopSpeech()
    }
  }, [markTopicViewed, topicId])

  if (loadState.state === "loading") {
    return <PageContainer className="py-10"><p aria-live="polite" className="text-ink-secondary">กำลังโหลดบทเรียน...</p></PageContainer>
  }

  if (loadState.state === "error") {
    const notFound = loadState.error === "topic_not_found"
    return <PageContainer className="py-10"><div className="empty-state mx-auto max-w-xl"><AlertCircle className="mx-auto h-7 w-7 text-amber-600" /><h1 className="mt-3 text-xl font-bold text-ink-DEFAULT">{notFound ? "ไม่พบบทเรียน Grammar นี้" : "โหลดบทเรียนไม่สำเร็จ"}</h1><p className="mt-2 text-ink-secondary">{notFound ? "ลิงก์นี้อาจไม่ถูกต้อง หรือบทเรียนถูกย้ายแล้ว" : "ลองเปิดใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่อของคุณ"}</p><Button className="mt-5" variant="secondary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />กลับไปหน้า Grammar</Button></div></PageContainer>
  }

  const { topic } = loadState
  const rules = getRules(topic)

  if (showPractice) return <PageContainer className="py-7 sm:py-10"><main className="mx-auto max-w-4xl"><GrammarPractice topic={topic} onQuit={() => setShowPractice(false)} onComplete={({ attempted }) => { if (attempted > 0) markTopicCompleted(topic.id); setShowPractice(false) }} /></main></PageContainer>

  return (
    <PageContainer className="py-7 sm:py-10">
      <main className="mx-auto max-w-4xl">
        <button onClick={onBack} className="mb-6 inline-flex min-h-11 items-center text-sm font-medium text-ink-secondary hover:text-ink-DEFAULT hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg -ml-3 px-3 transition-all active:scale-[0.98]"><ArrowLeft className="mr-1.5 h-4 w-4 shrink-0" />กลับไปหน้า Grammar</button>
        <PageHeader
          subtitle={topic.categoryId}
          title={topic.name}
          description={topic.nameThai}
          rightContent={
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-primary font-bold bg-primary-active px-3 py-1.5 rounded-full text-sm">
                <Clock className="h-4 w-4" />{topic.estimatedMinutes} นาที
              </span>
              <div className="group relative flex items-center">
                <div tabIndex={0} className="p-3 -m-3 text-primary sm:hover:text-primary cursor-help flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full transition-colors">
                  <Info className="w-5 h-5" />
                </div>
                <div className="pointer-events-none absolute right-0 top-full mt-2 w-[calc(100vw-3rem)] max-w-sm sm:w-80 opacity-0 shadow-lg bg-slate-800 text-white text-sm font-medium tracking-wide rounded-lg p-3 transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100 z-[100]">
                  <div className="absolute -top-1 right-4 border-[6px] border-transparent border-b-slate-800"></div>
                  <p className="leading-relaxed">{topic.summary.th}</p>
                </div>
              </div>
            </div>
          }
        />

        <div className="mt-7">
          <LessonSection title="Learning Objectives">
            <ul className="space-y-4 text-ink-DEFAULT max-w-[65ch] surface-card p-6 sm:p-8">
              {topic.learningObjectives.map((objective) => (
                <li key={objective} className="flex gap-4 items-start">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="leading-relaxed text-lg">{objective}</span>
                </li>
              ))}
            </ul>
          </LessonSection>
          <LessonSection title="When to Use">
            <div className="grid gap-5 sm:grid-cols-2">
              {topic.uses.map((use) => (
                <article key={use.id} className="surface-card p-6 flex flex-col hover:border-primary/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink-dark text-lg">{use.title}</h3>
                      <p className="mt-2 text-ink-secondary leading-relaxed">{use.descriptionThai}</p>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-border mt-auto">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-ink-DEFAULT">{use.example}</p>
                        <p className="text-sm text-ink-secondary mt-1">{use.translation}</p>
                      </div>
                      <SpeakButton text={use.example} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </LessonSection>
          <LessonSection title="Sentence Structures">
            <div className="space-y-8">
              {topic.structures.map((structure) => (
                <article key={structure.id} className="surface-card p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <h3 className="font-bold text-ink-dark text-xl">
                      {structure.type} 
                      <span className="text-ink-secondary font-medium ml-3 px-3 py-1 bg-slate-100 rounded-md text-sm">{structure.subjectGroup}</span>
                    </h3>
                  </div>
                  <div className="bg-[#0D1B2A] rounded-xl p-5 sm:p-6 shadow-inner border border-[#1B263B]">
                    <p className="font-mono text-lg sm:text-xl font-bold text-emerald-400 tracking-wide break-words">{structure.formula}</p>
                  </div>
                  <div className="mt-6 flex items-start gap-4 bg-primary-soft/50 p-5 rounded-xl border border-primary/10">
                    <div className="flex-1">
                      <p className="text-ink-dark text-lg font-medium">{structure.example}</p>
                      <p className="text-sm text-ink-secondary mt-1.5">{structure.translation}</p>
                    </div>
                    <SpeakButton text={structure.example} />
                  </div>
                  <div className="mt-5 flex gap-3 text-sm text-ink-secondary leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p>{structure.noteThai}</p>
                  </div>
                </article>
              ))}
            </div>
          </LessonSection>
          <LessonSection title="Grammar Rules">
            {rules.length ? (
              <div className="space-y-6">
                {rules.map((rule) => (
                  <article key={rule.id} className="bg-card border-l-4 border-l-primary shadow-sm rounded-r-xl p-6 sm:p-8 border-y border-r border-border">
                    <h3 className="font-bold text-ink-dark text-xl">{rule.title}</h3>
                    <p className="mt-3 text-ink-DEFAULT leading-relaxed">{rule.ruleThai}</p>
                    <ul className="mt-5 space-y-3">
                      {rule.examples.map((example) => (
                        <li key={example} className="flex items-start gap-4 bg-slate-50/70 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                          <span className="flex-1 text-ink-dark font-medium text-lg">{example}</span>
                          <SpeakButton text={example} />
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-ink-secondary">ไม่มีรายละเอียดกฎเพิ่มเติมสำหรับบทเรียนนี้</p>
            )}
          </LessonSection>
          <LessonSection title="Time Markers">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
              {topic.timeMarkers.map((marker) => (
                <article key={marker.text} className="flex flex-col surface-card hover:border-primary/40 hover:shadow-md transition-all p-5">
                  <h3 className="font-bold text-ink-dark text-xl">{marker.text}</h3>
                  <p className="text-sm text-ink-secondary mt-1.5">{marker.meaningThai}</p>
                  <div className="mt-auto pt-4 mt-4 border-t border-border flex items-start justify-between gap-3">
                    <span className="text-sm text-ink-dark font-medium leading-tight flex-1">{marker.example}</span>
                    <SpeakButton text={marker.example} />
                  </div>
                </article>
              ))}
            </div>
          </LessonSection>
          <LessonSection title="Example Sentences">
            <div className="space-y-4">
              {topic.examples.map((example) => (
                <article key={example.id} className="surface-card p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center hover:border-primary/30 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-ink-dark text-lg">{example.sentence}</p>
                    <p className="text-sm text-ink-secondary mt-1">{example.translation}</p>
                    {example.usage && <p className="mt-3 text-sm text-primary font-medium bg-primary-soft inline-block px-3 py-1 rounded-full">{example.usage}</p>}
                  </div>
                  <SpeakButton text={example.sentence} />
                </article>
              ))}
            </div>
          </LessonSection>
          <LessonSection title="Common Mistakes">
            <div className="space-y-6">
              {topic.commonMistakes.map((mistake) => (
                <article key={mistake.id} className="surface-card p-0 overflow-hidden">
                  <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <div className="flex items-start gap-4 bg-rose-50/50 p-5 sm:p-6 hover:bg-rose-50 transition-colors">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                        <X className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-rose-900 line-through decoration-rose-400 decoration-2 text-lg">{mistake.incorrect}</p>
                        <p className="text-sm text-rose-700/80 mt-1.5 font-medium">ผิดแกรมม่า</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 bg-emerald-50/30 p-5 sm:p-6 hover:bg-emerald-50/60 transition-colors">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-ink-dark text-lg">{mistake.correct}</p>
                        <p className="text-sm text-ink-dark mt-1.5 leading-relaxed">{mistake.explanationThai}</p>
                      </div>
                      <SpeakButton text={mistake.correct} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </LessonSection>
          <LessonSection title="Comparisons">
            <div className="space-y-10">
              {topic.comparisons.map((comparison) => {
                const sides = Object.values(comparison).filter(isComparisonSide);
                return (
                  <article key={comparison.id} className="surface-card p-0 overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800 border-b border-border p-5 sm:p-6">
                      <h3 className="font-bold text-ink-dark text-xl">{comparison.title}</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                      {sides.map((side) => (
                        <div key={`${side.name ?? "this"}-${side.formula}`} className="flex flex-col p-5 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <p className="font-bold text-ink-dark text-lg">{side.name ?? topic.name}</p>
                          <p className="mt-2 text-sm text-ink-secondary leading-relaxed">{side.useThai}</p>
                          <div className="mt-5 inline-block self-start bg-[#0D1B2A] px-4 py-2 rounded-lg text-sm font-mono font-bold text-emerald-400 tracking-wide break-words shadow-inner">
                            {side.formula}
                          </div>
                          <div className="mt-6 flex items-start gap-3 border-t border-border pt-5">
                            <div className="flex-1">
                              <p className="text-ink-DEFAULT font-medium">{side.example}</p>
                              <p className="text-sm text-ink-secondary mt-1">{side.translation}</p>
                            </div>
                            <SpeakButton text={side.example} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-primary-soft/50 border-t border-border p-5 sm:p-6 flex items-start gap-4">
                      <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-ink-dark font-medium leading-relaxed">{comparison.keyDifferenceThai}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </LessonSection>
          <LessonSection title="Lesson Summary">
            <div className="surface-card p-6 sm:p-8 bg-gradient-to-br from-primary-soft/50 to-white">
              <p className="text-ink-dark font-medium leading-relaxed max-w-[65ch] text-lg">{topic.summary.th}</p>
            </div>
          </LessonSection>
        </div>

        <div className="sticky bottom-0 z-10 bg-card/90 backdrop-blur-md border-t border-primary/20 p-4 -mx-4 sm:mx-0 sm:bg-transparent sm:backdrop-blur-none sm:static sm:p-0 sm:pt-6 sm:mt-6 sm:border-none">
          <Button className="w-full sm:w-auto min-h-[3.5rem] px-8 text-lg font-bold shadow-lg sm:shadow-md hover:scale-[1.02] transition-transform" onClick={() => setShowPractice(true)}>
            <span>Start Practice</span>
          </Button>
        </div>
      </main>
    </PageContainer>
  )
}
