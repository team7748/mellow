import { useState, useEffect, useRef } from "react"
import { CheckCircle2, Volume2, ChevronRight, Sparkles } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useProfileForAuth } from "../hooks/useProfile"
import { useLearningActivityLedger } from "../hooks/useLearningActivityLedger"
import {
  summarizeLearningActivity,
  type ActivityProgress,
} from "../lib/activity/activitySummary"
import {
  getHomeProgressSummary,
  getHomeQuickReview,
} from "../utils/homeProgress"
import type { WordStatus } from "../types/vocabulary"
import { FLASHCARD_SETUP_KEY, DEFAULT_FILTERS } from "../hooks/useUnifiedFlashcardSetup"
import { PageContainer } from "../components/layout/PageContainer"
import { Card, CardContent } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import {
  ReviewSlothMascot,
} from "../components/mascot/ReviewSlothMascot"

import slothHeroUrl from "../assets/images/home-sloth.png"
import continueLearningUrl from "../assets/images/image2.2.png"
import wordsLearnedUrl from "../assets/images/stat-words-learned.png"
import dayStreakUrl from "../assets/images/stat-day-streak.png"
import dailyGoalUrl from "../assets/images/stat-daily-goal.png"
import leafAccentUrl from "../assets/images/home-leaf-accent.png"
import missionReviewUrl from "../assets/images/mission-review.png"
import missionFlashcardUrl from "../assets/images/mission-flashcard.png"
import missionSpeakUrl from "../assets/images/mission-speak.png"
import catTravelUrl from "../assets/images/category-travel.png"
import catFoodUrl from "../assets/images/category-food.png"
import catWorkUrl from "../assets/images/category-work.png"
import catPeopleUrl from "../assets/images/category-people.png"
import catDailyUrl from "../assets/images/category-daily-life.png"

type HomePageProps = {
  onOpenVocabulary?: (category?: string) => void
  onStartFlashcard?: () => void
}

const categories = [
  { label: "ท่องเที่ยว", accessibleLabel: "Travel", filterValue: "Travel", image: catTravelUrl },
  { label: "อาหาร", accessibleLabel: "Food", filterValue: "Food & Drinks", image: catFoodUrl },
  { label: "การทำงาน", accessibleLabel: "Work", filterValue: "School & Work", image: catWorkUrl },
  { label: "ผู้คน", accessibleLabel: "People", filterValue: "People & Family", image: catPeopleUrl },
  { label: "ชีวิตประจำวัน", accessibleLabel: "Daily Life", filterValue: "Daily Life", image: catDailyUrl },
]

const statusLabels: Record<WordStatus, string> = {
  new: "ยังไม่เริ่ม",
  learning: "กำลังเรียน",
  review: "ควรทบทวน",
  mastered: "จำได้แล้ว",
}

/* ─── Animated Number Component ───────────────────────────── */
function AnimatedNumber({ value, duration = 2500 }: { value: number; duration?: number }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const end = value
    if (end === 0) {
      setCurrent(0)
      return
    }

    let startTimestamp: number | null = null

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)

      // easeOutExpo for a nice snappy start and slow finish
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      setCurrent(Math.floor(easeProgress * end))

      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setCurrent(end)
      }
    }

    window.requestAnimationFrame(step)
  }, [value])

  return <>{current.toLocaleString()}</>
}

/* ─── Stat Item (reusable) ──────────────────────────────── */

type StatItemProps = {
  icon: string
  value: React.ReactNode
  label: string
  bgClass: string
}

function StatItem({ icon, value, label, bgClass }: StatItemProps) {
  return (
    <div className="group flex flex-col sm:flex-row flex-1 items-center justify-center sm:justify-start gap-1.5 sm:gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] cursor-default text-center sm:text-left w-full sm:w-auto">
      <span className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border ${bgClass} transition-colors duration-300 group-hover:border-primary/40 shadow-sm sm:shadow-none`}>
        <img src={icon} alt="" className="h-5 w-5 sm:h-8 sm:w-8 object-contain transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[10deg]" />
      </span>
      <span className="min-w-0 flex flex-col items-center sm:items-start">
        <strong className="text-sm font-black leading-tight text-ink-dark sm:text-2xl transition-colors duration-300 group-hover:text-primary tabular-nums tracking-tight">
          {value}
        </strong>
        <span className="text-xs font-semibold text-ink-secondary sm:text-xs leading-relaxed line-clamp-1 mt-0.5 sm:mt-0 tracking-wide text-balance">
          {label}
        </span>
      </span>
    </div>
  )
}

/* ─── Mission Item (Desktop: vertical list / Mobile: compact card) ── */

type MissionItemProps = {
  title: string
  icon: string
  progress: ActivityProgress
  onClick: () => void
  accentBg?: string
  barColor?: string
}

function MissionItem({ title, icon, progress, onClick, accentBg = "bg-primary-soft", barColor = "bg-primary" }: MissionItemProps) {
  return (
    <button
      type="button"
      aria-label={`${title} mission: ${progress.completed} of ${progress.target}`}
      onClick={onClick}
      className="home-mission-item group flex w-full min-w-0 items-center gap-3 text-left transition-all duration-150 hover:bg-slate-50 active:scale-[0.99] active:bg-slate-50/80 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-6 lg:py-5"
    >
      <span className={`flex h-11 w-11 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-xl border ${accentBg} transition-transform duration-300 group-hover:scale-105`}>
        <img
          src={icon}
          alt=""
          className="h-7 w-7 sm:h-9 sm:w-9 object-contain"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-1.5 sm:gap-2">
          <strong className="text-sm font-bold text-ink-dark sm:text-base">
            {title}
          </strong>
          <span className="shrink-0 text-[0.6875rem] font-semibold text-ink-secondary sm:text-xs">
            {progress.completed} / {progress.target}
          </span>
        </span>
        <span
          role="progressbar"
          aria-label={`${title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percentage}
          className="mt-2.5 block h-[4px] sm:h-[5px] overflow-hidden rounded-full bg-progress-track"
        >
          <span
            className={`block h-full rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${progress.percentage}%` }}
          />
        </span>
      </span>
    </button>
  )
}

/* ─── Home Page ──────────────────────────────────────────── */

export function HomePage({
  onOpenVocabulary,
  onStartFlashcard,
}: HomePageProps) {
  const { user, isLoading } = useAuth()
  const { profile } = useProfileForAuth(user, isLoading)
  const now = new Date()
  const stats = getHomeProgressSummary(now)
  const activityLedger = useLearningActivityLedger(user?.id)
  const activity = summarizeLearningActivity(activityLedger, {
    now,
    dueReviewWordsNow: stats.dueReviewWords,
  })
  const quickReview = getHomeQuickReview()
  // Mascot ref is no longer needed for the new component
  const displayName =
    profile?.display_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Student"

  const [greeting, setGreeting] = useState('สวัสดี')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting('สวัสดีตอนเช้า')
    } else if (hour >= 12 && hour < 14) {
      setGreeting('สวัสดีตอนกลางวัน')
    } else if (hour >= 14 && hour < 16) {
      setGreeting('สวัสดีตอนบ่าย')
    } else if (hour >= 16 && hour < 19) {
      setGreeting('สวัสดีตอนเย็น')
    } else {
      setGreeting('สวัสดีตอนกลางคืน')
    }
  }, [])

  const handleContinueLearning = () => {
    const lastActive = localStorage.getItem("last_active_route") || "vocabulary"
    window.location.hash = lastActive
  }

  const openVocabulary = (category?: string) => {
    if (onOpenVocabulary) {
      onOpenVocabulary(category)
      return
    }
    window.location.hash = category ? `vocabulary?category=${encodeURIComponent(category)}` : "vocabulary"
  }

  const startFlashcard = (reviewDue: boolean = false) => {
    if (reviewDue) {
      window.location.hash = "flashcard?filterStatus=srs-due-now&mode=reviewForgot"
    } else {
      // Still call onStartFlashcard for default routing if provided, to preserve old behavior
      if (onStartFlashcard) {
        onStartFlashcard()
        return
      }
      window.location.hash = "flashcard"
    }
  }

  const openSpeak = () => {
    window.location.hash = "speak"
  }

  return (
    <PageContainer className="home-page py-4 sm:py-6 lg:py-8">

      {/* ════════════════════════════════════════════════════
          SECTION 1 — Hero
          Mobile: open background, text left + sloth right
          Desktop: card with bg-primary-soft
          ════════════════════════════════════════════════════ */}
      <section
        data-home-section="hero"
        aria-label="Welcome"
        className="relative overflow-hidden sm:rounded-t-2xl sm:rounded-b-none sm:border sm:border-b-0 sm:border-primary/10 sm:bg-gradient-to-br sm:from-primary-soft sm:via-white sm:to-primary-muted animate-fade-in-up opacity-0-init"
      >
        {/* Hero Content */}
        <div className="relative flex flex-col-reverse sm:flex-row min-h-[14rem] sm:min-h-[16rem] lg:min-h-[18rem]">
          {/* Text side */}
          <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center sm:items-start justify-center text-center sm:text-left py-5 sm:py-6 px-4 sm:px-8 lg:px-10">
            <p className="text-[0.8125rem] font-bold text-primary sm:text-base tracking-wide uppercase sm:-translate-y-2.5">
              {greeting},
            </p>
            <div className="mt-1 sm:mt-1 flex min-w-0 items-end justify-center sm:justify-start gap-1.5 sm:gap-2">
              <h1 className="min-w-0 overflow-wrap-anywhere text-[2rem] font-black tracking-tight text-ink-dark sm:text-4xl lg:text-[3.25rem] drop-shadow-sm leading-tight">
                {displayName}!
              </h1>
              <img
                src={leafAccentUrl}
                alt=""
                className="mb-1 h-7 w-7 shrink-0 object-contain sm:mb-1 sm:h-9 sm:w-9"
              />
            </div>
            <p className="mt-2 sm:mt-3 text-[0.875rem] sm:text-base font-medium leading-relaxed text-ink-secondary">
              <span className="block sm:inline">ค่อย ๆ เรียนรู้</span>
              <span className="hidden sm:inline"> </span>
              <span className="block sm:inline">แล้วภาษาอังกฤษจะง่ายขึ้น</span>
            </p>
          </div>

          {/* Image side */}
          <div
            className="relative w-full h-[150px] sm:h-auto sm:w-[45%] shrink-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] sm:[mask-image:linear-gradient(to_right,transparent,black_15%,black_100%)]"
          >
            <img
              fetchPriority="high"
              src={slothHeroUrl}
              alt="สลอธกำลังเรียนภาษาอังกฤษ"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[200px] w-auto object-cover object-[center_top] translate-y-8 sm:inset-0 sm:left-auto sm:transform-none sm:h-full sm:w-full sm:object-[right_top] sm:-translate-x-6 sm:translate-y-5 sm:scale-[1.05]"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SECTION 2 — Stats Strip
          Standalone rounded card for all screens
          ════════════════════════════════════════════════════ */}
      <Card
        data-home-section="stats"
        aria-label="Learning statistics"
        className="mt-3 sm:mt-0 relative z-10 sm:rounded-t-none sm:rounded-b-2xl border-t-0 sm:border-t sm:border-primary/10 shadow-sm shadow-black/5 animate-fade-in-up opacity-0-init delay-100 overflow-hidden"
      >
        <h2 className="sr-only">สถิติการเรียน</h2>
        <CardContent className="p-3 sm:p-6 lg:p-8 pt-3 sm:pt-6 flex flex-row items-start sm:items-center justify-between divide-x divide-border/40 sm:divide-x-0 sm:gap-0">
          <div className="flex-1 px-1 sm:px-0">
            <StatItem
              icon={dayStreakUrl}
              value={<AnimatedNumber value={activity.streakDays} duration={1000} />}
              label="วันที่เรียนต่อเนื่อง"
              bgClass="bg-gradient-to-br from-orange-50 to-amber-100 border-amber-200/60"
            />
          </div>

          <div className="hidden sm:block mx-2.5 sm:mx-6 h-10 w-px shrink-0 bg-border" />

          <div className="flex-1 px-1 sm:px-0">
            <StatItem
              icon={dailyGoalUrl}
              value={
                <span className={activity.dailyGoal.completed >= activity.dailyGoal.target ? "text-primary" : ""}>
                  <span>
                    <AnimatedNumber value={activity.dailyGoal.completed} duration={2000} />
                  </span>
                  <span className={activity.dailyGoal.completed >= activity.dailyGoal.target ? "" : "text-ink-secondary/60 text-[0.85em] group-hover:text-primary/70 transition-colors"}>
                    /{activity.dailyGoal.target}
                  </span>
                </span>
              }
              label="เป้าหมายรายวัน"
              bgClass="bg-gradient-to-br from-blue-50 to-cyan-100 border-cyan-200/60"
            />
          </div>

          <div className="hidden sm:block mx-2.5 sm:mx-6 h-10 w-px shrink-0 bg-border" />

          <div className="flex-1 px-1 sm:px-0">
            <StatItem
              icon={wordsLearnedUrl}
              value={<AnimatedNumber value={stats.learnedWords} />}
              label="คำศัพท์ที่เรียนไป"
              bgClass="bg-gradient-to-br from-green-50 to-emerald-100 border-emerald-200/60"
            />
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════
          SECTION 3 — Main Content
          Mobile: single column, missions before explore
          Tablet & Desktop: two columns
          ════════════════════════════════════════════════════ */}
      <div className="mt-4 sm:mt-6 flex flex-col gap-4 sm:gap-6 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(16rem,1fr)] md:gap-6 lg:gap-7 md:items-start">

        {/* ── Left Column ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:gap-6 min-w-0">

          {/* Continue Learning Card */}
          <section
            data-home-section="continue"
            className="group overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#F4F9EE] via-white to-[#E8F3DB] transition-all duration-300 hover:shadow-md hover:border-primary/30 animate-fade-in-up opacity-0-init delay-200"
          >
            <div className="grid min-h-[12rem] grid-cols-[minmax(0,1.2fr)_minmax(5.5rem,0.8fr)] sm:min-h-[16rem] sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.85fr)]">
              {/* Text */}
              <div className="relative z-10 flex min-w-0 flex-col justify-center px-4 py-5 sm:px-8 sm:py-6">
                <span className="w-fit rounded-full bg-primary-active px-2.5 py-0.5 text-[0.6875rem] sm:text-xs font-bold text-primary tracking-wide uppercase whitespace-nowrap">
                  เรียนต่อ
                </span>
                <h2 className="mt-2 sm:mt-3 text-lg sm:text-2xl font-black tracking-tight text-ink-dark">
                  คำศัพท์ภาษาอังกฤษ
                </h2>
                <p className="mt-1 text-[0.8125rem] sm:text-sm font-semibold text-ink-secondary tabular-nums whitespace-nowrap">
                  {stats.learnedWords.toLocaleString()} / {stats.totalWords.toLocaleString()} คำ
                </p>
                <div
                  role="progressbar"
                  aria-label="ความคืบหน้าการเรียนคำศัพท์"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={stats.progressPercentage}
                  className="mt-2 h-2 w-full max-w-48 overflow-hidden rounded-full bg-progress-track"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-green-400 transition-all duration-500"
                    style={{ width: `${stats.progressPercentage}%` }}
                  />
                </div>
                <Button
                  onClick={handleContinueLearning}
                  variant="primary"
                  size="lg"
                  className="group/btn relative overflow-hidden mt-4 sm:mt-5 w-full sm:w-fit"
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 w-full whitespace-nowrap">
                    เรียนต่อ
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover/btn:translate-x-1" strokeWidth={2.5} />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </Button>
              </div>

              {/* Image */}
              <div className="flex min-w-0 items-center justify-center overflow-visible px-1 pt-4 sm:px-2 sm:pt-2">
                <img
                  loading="lazy"
                  src={continueLearningUrl}
                  alt=""
                  className="h-full max-h-[12rem] w-full object-contain object-center scale-[1.4] sm:scale-[1.2] origin-center -translate-x-3 sm:-translate-x-6 group-hover:scale-[1.45] sm:group-hover:scale-[1.25] transition-transform duration-700 ease-out"
                />
              </div>
            </div>
          </section>

          {/* Explore Categories — Desktop only in left col; mobile shows below missions */}
          <section data-home-section="explore" className="hidden sm:block min-w-0 animate-fade-in-up opacity-0-init delay-300">
            <h2 className="text-lg font-extrabold tracking-tight text-ink-dark">สำรวจหมวดหมู่</h2>
            <div className="mt-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
              <div className="flex w-max gap-4 pb-3 pt-1 animate-marquee hover:[animation-play-state:paused] active:[animation-play-state:paused]">
                {[...categories, ...categories, ...categories, ...categories].map((category, idx) => (
                  <button
                    key={`${category.accessibleLabel}-${idx}`}
                    type="button"
                    aria-label={`เปิดหมวด ${category.accessibleLabel}`}
                    onClick={() => openVocabulary(category.filterValue)}
                    className="group shrink-0 flex min-h-[6.5rem] w-[8rem] flex-col items-center justify-center gap-2.5 rounded-xl border border-border bg-card shadow-sm px-3 py-3.5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md active:scale-95"
                  >
                    <img
                      loading="lazy"
                      src={category.image}
                      alt=""
                      className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                    <span className="text-sm font-bold text-ink-dark tracking-tight">
                      {category.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ── Right Column (Sidebar on Desktop) ───────────── */}
        <div className="flex flex-col gap-4 sm:gap-5 min-w-0">

          {/* Today's Missions */}
          <section
            data-home-section="missions"
            aria-labelledby="home-missions-title"
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-border/30 transition-shadow duration-300 hover:shadow-md animate-fade-in-up opacity-0-init delay-200"
          >
            <h2
              id="home-missions-title"
              className="px-4 sm:px-5 pb-1 pt-4 sm:pt-5 text-base sm:text-lg font-extrabold text-ink-dark tracking-tight"
            >
              ภารกิจประจำวัน
            </h2>
            <div className="divide-y divide-border/60">
              {activity.missions.review.visible ? (
                <MissionItem
                  title="ทบทวนคำศัพท์"
                  icon={missionReviewUrl}
                  progress={activity.missions.review}
                  onClick={() => startFlashcard(true)}
                  accentBg="bg-gradient-to-br from-orange-50 to-amber-100 border-amber-200/60"
                  barColor="bg-gradient-to-r from-orange-400 to-amber-400"
                />
              ) : null}
              <MissionItem
                title="แฟลชการ์ด"
                icon={missionFlashcardUrl}
                progress={activity.missions.flashcards}
                onClick={() => startFlashcard(false)}
                accentBg="bg-gradient-to-br from-blue-50 to-cyan-100 border-cyan-200/60"
                barColor="bg-gradient-to-r from-blue-400 to-cyan-400"
              />
              <MissionItem
                title="ฝึกพูด"
                icon={missionSpeakUrl}
                progress={activity.missions.speak}
                onClick={openSpeak}
                accentBg="bg-gradient-to-br from-purple-50 to-fuchsia-100 border-fuchsia-200/60"
                barColor="bg-gradient-to-r from-purple-400 to-fuchsia-400"
              />
            </div>
          </section>

          {/* Explore Categories — Mobile only (shows after missions) */}
          <section data-home-section="explore-mobile" className="sm:hidden min-w-0 animate-fade-in-up opacity-0-init delay-300">
            <h2 className="px-1 text-base font-extrabold tracking-tight text-ink-dark">สำรวจหมวดหมู่</h2>
            <div className="mt-2.5 overflow-hidden -mx-4 px-4 [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
              <div className="flex w-full gap-3 pb-3 pt-1 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {categories.map((category, idx) => (
                  <button
                    key={`${category.accessibleLabel}-${idx}`}
                    type="button"
                    aria-label={`เปิดหมวด ${category.accessibleLabel}`}
                    onClick={() => openVocabulary(category.filterValue)}
                    className="group snap-start shrink-0 flex min-h-[6rem] w-[6.5rem] flex-col items-center justify-center gap-2.5 rounded-xl border border-border bg-card shadow-sm px-2 py-3 text-center transition-all duration-200 active:scale-95"
                  >
                    <img
                      loading="lazy"
                      src={category.image}
                      alt=""
                      className="h-10 w-10 object-contain"
                    />
                    <span className="text-[0.75rem] font-bold text-ink-dark leading-tight">
                      {category.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Quick Review */}
          {/* Quick Review */}
          {quickReview ? (
            <section
              data-home-section="quick-review"
              className="relative mt-6 sm:mt-8 overflow-visible rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-primary/10 p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-primary/30 animate-fade-in-up opacity-0-init delay-300 group"
            >
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-center text-center">
                <div className="relative isolate overflow-visible w-full shrink-0 sm:w-[220px] lg:w-[260px]">
                  <ReviewSlothMascot reviewCount={stats.dueReviewWords} />
                  <Button
                    onClick={() => startFlashcard(true)}
                    variant="primary"
                    className="relative z-10 w-full sm:w-auto inline-flex items-center justify-center rounded-full px-6 py-3.5 sm:py-2.5 text-base sm:text-sm font-bold tracking-wide shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                  >
                    เริ่มทบทวน
                  </Button>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </PageContainer>
  )
}
