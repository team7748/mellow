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
  return <section className="border-t border-primary/20 py-10 sm:py-12 first:border-t-0 first:pt-0"><h2 className="mb-6 text-2xl font-bold text-ink-DEFAULT tracking-tight">{title}</h2>{children}</section>
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
        <button onClick={onBack} className="mb-6 inline-flex min-h-11 items-center text-sm font-semibold text-ink-secondary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all active:scale-[0.98]"><ArrowLeft className="mr-1 h-4 w-4" />กลับไปหน้า Grammar</button>
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
          <LessonSection title="Learning Objectives"><ul className="space-y-2 text-ink-DEFAULT max-w-[65ch]">{topic.learningObjectives.map((objective) => <li key={objective} className="flex gap-2"><ListChecks className="mt-1 h-4 w-4 shrink-0 text-primary" />{objective}</li>)}</ul></LessonSection>
          <LessonSection title="When to Use"><div className="space-y-5">{topic.uses.map((use) => <article key={use.id}><h3 className="font-bold text-ink-DEFAULT">{use.title}</h3><p className="mt-1 text-ink-DEFAULT max-w-[65ch]">{use.descriptionThai}</p><p className="mt-2 flex items-start gap-2 font-medium text-ink-DEFAULT"><span>{use.example}</span><SpeakButton text={use.example} /></p><p className="text-sm text-ink-secondary">{use.translation}</p></article>)}</div></LessonSection>
          <LessonSection title="Sentence Structures"><div className="space-y-8">{topic.structures.map((structure) => <article key={structure.id} className="relative pl-5 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-slate-200 before:rounded-full"><h3 className="font-bold text-ink-DEFAULT text-lg">{structure.type} <span className="text-ink-secondary font-normal">· {structure.subjectGroup}</span></h3><div className="mt-3 inline-block bg-primary-soft border border-primary/20 rounded-lg px-4 py-2"><p className="font-mono text-base font-semibold text-primary break-words tracking-wide">{structure.formula}</p></div><div className="mt-4 flex items-start gap-3"><div className="flex-1"><p className="text-ink-DEFAULT text-lg font-medium">{structure.example}</p><p className="text-sm text-ink-secondary mt-1">{structure.translation}</p></div><SpeakButton text={structure.example} /></div><p className="mt-3 text-sm text-ink-secondary leading-relaxed max-w-[65ch]">{structure.noteThai}</p></article>)}</div></LessonSection>
          <LessonSection title="Grammar Rules">{rules.length ? <div className="space-y-5">{rules.map((rule) => <article key={rule.id}><h3 className="font-bold text-ink-DEFAULT">{rule.title}</h3><p className="mt-1 text-ink-DEFAULT">{rule.ruleThai}</p><ul className="mt-2 space-y-1 text-sm text-ink-secondary">{rule.examples.map((example) => <li key={example} className="flex items-center gap-2"><span>{example}</span><SpeakButton text={example} /></li>)}</ul></article>)}</div> : <p className="text-ink-secondary">ไม่มีรายละเอียดกฎเพิ่มเติมสำหรับบทเรียนนี้</p>}</LessonSection>
          <LessonSection title="Time Markers"><div className="flex flex-wrap gap-3">{topic.timeMarkers.map((marker) => <article key={marker.text} className="inline-flex flex-col bg-primary-soft border border-primary/20 rounded-xl px-5 py-4 min-w-[200px] flex-1 sm:flex-none"><h3 className="font-bold text-ink-DEFAULT text-lg">{marker.text}</h3><p className="text-sm text-ink-secondary mb-3">{marker.meaningThai}</p><div className="mt-auto pt-3 border-t border-primary/20 flex items-start gap-2 justify-between"><span className="text-sm text-ink-DEFAULT font-medium">{marker.example}</span><SpeakButton text={marker.example} /></div></article>)}</div></LessonSection>
          <LessonSection title="Example Sentences"><div className="space-y-4">{topic.examples.map((example) => <article key={example.id}><div className="flex items-start gap-2"><p className="font-medium text-ink-DEFAULT">{example.sentence}</p><SpeakButton text={example.sentence} /></div><p className="text-sm text-ink-secondary">{example.translation}</p><p className="mt-1 text-sm text-ink-secondary">{example.usage}</p></article>)}</div></LessonSection>
          <LessonSection title="Common Mistakes"><div className="space-y-6">{topic.commonMistakes.map((mistake) => <article key={mistake.id} className="grid sm:grid-cols-2 gap-4"><div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100/50"><X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" /><div><p className="font-medium text-rose-900 line-through decoration-rose-300">{mistake.incorrect}</p><p className="text-sm text-rose-700/80 mt-1">ผิดแกรมม่า</p></div></div><div className="flex items-start gap-3 bg-primary-soft p-4 rounded-xl border border-primary/20"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><div className="flex-1"><p className="font-medium text-ink-dark">{mistake.correct}</p><p className="text-sm text-ink-dark mt-1">{mistake.explanationThai}</p></div><SpeakButton text={mistake.correct} /></div></article>)}</div></LessonSection>
          <LessonSection title="Comparisons"><div className="space-y-10">{topic.comparisons.map((comparison) => { const sides = Object.values(comparison).filter(isComparisonSide); return <article key={comparison.id}><h3 className="font-bold text-ink-DEFAULT text-xl mb-4">{comparison.title}</h3><div className="grid sm:grid-cols-2 gap-6 sm:gap-0 sm:divide-x divide-emerald-100/60 border-y border-primary/20 py-6">{sides.map((side, idx) => <div key={`${side.name ?? "this"}-${side.formula}`} className={`flex flex-col ${idx === 0 ? "sm:pr-6" : "sm:pl-6 pt-6 border-t border-primary/20 sm:border-t-0 sm:pt-0"}`}><p className="font-bold text-ink-DEFAULT text-lg">{side.name ?? topic.name}</p><p className="mt-1 text-sm text-ink-secondary">{side.useThai}</p><div className="mt-4 inline-block self-start bg-primary-soft border border-primary/20 px-3 py-1.5 rounded text-xs font-mono font-semibold text-ink-DEFAULT break-words">{side.formula}</div><div className="mt-4 flex items-start gap-2 justify-between border-t border-primary/20 pt-4"><div className="flex-1"><p className="text-ink-DEFAULT font-medium">{side.example}</p><p className="text-sm text-ink-secondary mt-1">{side.translation}</p></div><SpeakButton text={side.example} /></div></div>)}</div><p className="mt-5 text-ink-DEFAULT font-medium flex items-start gap-2"><Info className="w-5 h-5 text-primary shrink-0" /> {comparison.keyDifferenceThai}</p></article>})}</div></LessonSection>
          <LessonSection title="Lesson Summary"><p className="text-ink-DEFAULT max-w-[65ch]">{topic.summary.th}</p><ul className="mt-3 space-y-1 text-sm text-ink-secondary max-w-[65ch]">{topic.learningObjectives.map((objective) => <li key={objective}>• {objective}</li>)}</ul></LessonSection>
        </div>

        <div className="sticky bottom-0 z-10 bg-card/90 backdrop-blur-md border-t border-primary/20 p-4 -mx-4 sm:mx-0 sm:bg-transparent sm:backdrop-blur-none sm:static sm:p-0 sm:pt-6 sm:mt-2"><Button className="w-full sm:w-auto shadow-md sm:shadow-none" onClick={() => setShowPractice(true)}><span>Start Practice</span></Button></div>
      </main>
    </PageContainer>
  )
}
