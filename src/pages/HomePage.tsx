import { CheckCircle2, Volume2 } from "lucide-react"
import { Container } from "../components/layout/Container"
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

import slothHeroUrl from "../assets/images/home-sloth-reference.png"
import continueLearningUrl from "../assets/images/continue-learning-reference.png"
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
  onOpenVocabulary?: () => void
  onStartFlashcard?: () => void
}

const categories = [
  { label: "ท่องเที่ยว", accessibleLabel: "Travel", image: catTravelUrl },
  { label: "อาหาร", accessibleLabel: "Food", image: catFoodUrl },
  { label: "การทำงาน", accessibleLabel: "Work", image: catWorkUrl },
  { label: "ผู้คน", accessibleLabel: "People", image: catPeopleUrl },
  { label: "ชีวิตประจำวัน", accessibleLabel: "Daily Life", image: catDailyUrl },
]

const statusLabels: Record<WordStatus, string> = {
  new: "ยังไม่เริ่ม",
  learning: "กำลังเรียน",
  review: "ควรทบทวน",
  mastered: "จำได้แล้ว",
}

type MissionItemProps = {
  title: string
  icon: string
  progress: ActivityProgress
  onClick: () => void
}

function MissionItem({ title, icon, progress, onClick }: MissionItemProps) {
  return (
    <button
      type="button"
      aria-label={`${title} mission: ${progress.completed} of ${progress.target}`}
      onClick={onClick}
      className="home-mission-item group flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-primary-soft sm:px-5"
    >
      <img
        src={icon}
        alt=""
        className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <strong className="text-sm font-bold text-ink-dark sm:text-base">
            {title}
          </strong>
          <span className="shrink-0 text-xs font-semibold text-ink-secondary">
            {progress.completed} / {progress.target}
          </span>
        </span>
        <span
          role="progressbar"
          aria-label={`${title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percentage}
          className="mt-2 block h-1.5 overflow-hidden rounded-full bg-progress-track"
        >
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${progress.percentage}%` }}
          />
        </span>
      </span>
    </button>
  )
}

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
  const displayName =
    profile?.display_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Student"

  const handleContinueLearning = () => {
    const lastActive = localStorage.getItem("last_active_route") || "vocabulary"
    window.location.hash = lastActive
  }

  const openVocabulary = () => {
    if (onOpenVocabulary) {
      onOpenVocabulary()
      return
    }

    window.location.hash = "vocabulary"
  }

  const startFlashcard = () => {
    if (onStartFlashcard) {
      onStartFlashcard()
      return
    }

    window.location.hash = "flashcard"
  }

  const openSpeak = () => {
    window.location.hash = "speak"
  }

  return (
    <Container className="home-page py-4 sm:py-6 lg:py-8">
      <div className="home-dashboard">
        <section
          data-home-section="hero"
          className="home-hero overflow-hidden rounded-2xl border border-border bg-primary-soft"
        >
          <div className="home-hero-layout relative grid min-h-[15rem] grid-cols-[minmax(0,1.15fr)_minmax(8rem,0.85fr)] items-stretch sm:min-h-[18rem] sm:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
            <div className="relative z-10 flex min-w-0 flex-col justify-center px-5 py-7 sm:px-8 lg:px-10">
              <p className="text-base font-bold text-primary sm:text-lg">
                สวัสดีตอนเย็น,
              </p>
              <div className="home-hero-name-row mt-1 flex min-w-0 items-end gap-2">
                <h1 className="min-w-0 overflow-wrap-anywhere text-3xl font-black tracking-[-0.03em] text-ink-dark sm:text-5xl lg:text-6xl">
                  {displayName}!
                </h1>
                <img
                  src={leafAccentUrl}
                  alt=""
                  className="home-hero-leaf mb-1 h-7 w-7 shrink-0 object-contain sm:h-10 sm:w-10"
                />
              </div>
              <p className="mt-4 max-w-[24ch] text-sm font-medium leading-6 text-ink-secondary sm:text-base">
                ยิ่งเรียนรู้ ยิ่งเติบโต
              </p>
            </div>

            <div className="relative min-w-0 self-end overflow-hidden px-1 pt-4 sm:px-4">
              <img
                src={slothHeroUrl}
                alt="สลอธกำลังเรียนภาษาอังกฤษ"
                className="h-full max-h-[17rem] w-full object-contain object-bottom sm:max-h-[20rem]"
              />
            </div>
          </div>
        </section>

        <section
          data-home-section="stats"
          aria-label="Learning statistics"
          className="home-stats rounded-2xl bg-card px-3 py-4 shadow-soft sm:px-6 sm:py-5"
        >
          <div className="home-stats-grid">
            <div className="home-stat">
              <span className="home-stat-icon bg-mission-orangeBg">
                <img
                  src={dayStreakUrl}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="min-w-0">
                <strong className="home-stat-value">
                  {activity.streakDays}
                </strong>
                <span className="home-stat-label">Day streak</span>
              </span>
            </div>
            <div className="home-stat">
              <span className="home-stat-icon bg-primary-soft">
                <img
                  src={dailyGoalUrl}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="min-w-0">
                <strong className="home-stat-value">
                  {activity.dailyGoal.completed}/{activity.dailyGoal.target}
                </strong>
                <span className="home-stat-label">Daily goal</span>
              </span>
            </div>
            <div className="home-stat">
              <span className="home-stat-icon bg-primary-soft">
              <img
                src={wordsLearnedUrl}
                alt=""
                  className="h-full w-full object-contain"
              />
              </span>
              <span className="min-w-0">
                <strong className="home-stat-value">
                {stats.learnedWords.toLocaleString()}
              </strong>
                <span className="home-stat-label">
                Words learned
              </span>
              </span>
            </div>
          </div>
        </section>

        <section
          data-home-section="continue"
          className="home-continue overflow-hidden rounded-2xl border border-border bg-primary-soft"
        >
          <div className="home-continue-layout grid min-h-[18rem] grid-cols-[minmax(0,1.05fr)_minmax(8rem,0.95fr)] sm:min-h-[20rem] sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.9fr)]">
            <div className="relative z-10 flex min-w-0 flex-col justify-center px-5 py-6 sm:px-7 lg:px-8">
              <span className="w-fit rounded-full bg-primary-active px-3 py-1 text-xs font-bold text-primary">
                เรียนต่อ
              </span>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.02em] text-ink-dark sm:text-3xl">
                คำศัพท์ภาษาอังกฤษ
              </h2>
              <p className="mt-2 text-sm font-semibold text-ink-secondary sm:text-base">
                {stats.learnedWords.toLocaleString()} / {stats.totalWords.toLocaleString()} คำ
              </p>
              <div
                role="progressbar"
                aria-label="ความคืบหน้าการเรียนคำศัพท์"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stats.progressPercentage}
                className="mt-3 h-2 w-full max-w-56 overflow-hidden rounded-full bg-progress-track"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${stats.progressPercentage}%` }}
                />
              </div>
              <button
                type="button"
                onClick={handleContinueLearning}
                className="mt-5 inline-flex min-h-11 w-fit items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-primary-hover active:bg-primary-hover"
              >
                เรียนต่อ
              </button>
            </div>

            <div className="flex min-w-0 items-end justify-center overflow-hidden px-1 pt-8 sm:px-3 sm:pt-4">
              <img
                src={continueLearningUrl}
                alt=""
                className="h-full max-h-[18rem] w-full object-contain object-bottom sm:max-h-[20rem]"
              />
            </div>
          </div>
        </section>

        <section
          data-home-section="missions"
          aria-labelledby="home-missions-title"
          className="home-missions self-start overflow-hidden rounded-2xl border border-border bg-card"
        >
          <h2
            id="home-missions-title"
            className="px-4 pb-3 pt-4 text-lg font-black text-ink-dark sm:px-5 sm:pt-5"
          >
            Today's missions
          </h2>
          <div className="divide-y divide-border">
            {activity.missions.review.visible ? (
              <MissionItem
                title="Review"
                icon={missionReviewUrl}
                progress={activity.missions.review}
                onClick={startFlashcard}
              />
            ) : null}
            <MissionItem
              title="Flashcards"
              icon={missionFlashcardUrl}
              progress={activity.missions.flashcards}
              onClick={startFlashcard}
            />
            <MissionItem
              title="Speak"
              icon={missionSpeakUrl}
              progress={activity.missions.speak}
              onClick={openSpeak}
            />
          </div>
        </section>

        <section
          data-home-section="explore"
          className="home-explore min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5"
        >
          <h2 className="text-lg font-black text-ink-dark">สำรวจหมวดหมู่</h2>
          <div className="home-explore-scroll mt-3 pb-1">
            {categories.map((category) => (
              <button
                key={category.accessibleLabel}
                type="button"
                aria-label={`เปิดหมวด ${category.accessibleLabel}`}
                onClick={openVocabulary}
                className="group flex min-h-28 min-w-[7.25rem] flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-primary-soft px-3 py-3 text-center transition-colors duration-150 hover:bg-primary-active"
              >
                <img
                  src={category.image}
                  alt=""
                  className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                />
                <span className="text-xs font-bold text-ink sm:text-sm">
                  {category.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {quickReview ? (
          <section
            data-home-section="quick-review"
            className="home-quick-review self-start rounded-2xl border border-border bg-card p-4 sm:p-5"
          >
            <h2 className="text-lg font-black text-ink-dark">ทบทวนด่วน</h2>
            <article className="mt-3 flex min-w-0 items-center gap-3 rounded-xl bg-primary-soft p-3 sm:p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-active text-primary">
                <Volume2 aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <strong className="max-w-full overflow-wrap-anywhere text-base text-ink-dark">
                    {quickReview.word.word}
                  </strong>
                  <span className="rounded-full bg-primary-active px-2 py-0.5 text-[0.6875rem] font-bold text-primary">
                    {quickReview.word.partOfSpeechStandard ?? quickReview.word.partOfSpeech}
                  </span>
                </div>
                <p className="mt-1 overflow-wrap-anywhere text-xs font-medium leading-5 text-ink-secondary sm:text-sm">
                  {quickReview.word.thaiMeaning}
                </p>
              </div>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center text-success"
                title={statusLabels[quickReview.status]}
                aria-label={statusLabels[quickReview.status]}
              >
                <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
              </span>
            </article>
          </section>
        ) : null}
      </div>
    </Container>
  )
}
