import { useState, useMemo, useRef } from "react"
import { useAuth } from "../hooks/useAuth"
import { useProfile } from "../hooks/useProfile"
import { useLearningActivityLedger } from "../hooks/useLearningActivityLedger"
import { useGrammarProgress } from "../hooks/useGrammarProgress"
import { usePreferences } from "../hooks/usePreferences"
import { useI18n } from "../contexts/I18nContext"
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} from "../services/profileService"
import { loadProgress } from "../lib/storage"
import { PageContainer } from "../components/layout/PageContainer"
import { WeeklyActivityChart } from "../components/profile/WeeklyActivityChart"
import { ProfileSettings } from "../components/profile/ProfileSettings"
import { AccountSecurity } from "../components/profile/AccountSecurity"
import { summarizeWeeklyActivity } from "../lib/activity/weeklyActivitySummary"
import { summarizeLearningActivity } from "../lib/activity/activitySummary"
import {
  Loader2, TrendingUp,
  Pencil, CheckCircle2,
  Camera, Trash2
} from "lucide-react"

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.substring(0, 2).toUpperCase();
}

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, isLoading: isProfileLoading, setProfile } = useProfile()
  const { preferences } = usePreferences()
  const { t } = useI18n()

  // Data Hooks
  const ledger = useLearningActivityLedger(user?.id)
  // useUnifiedFlashcardSetup is client-side state but we can pull stats if we just need total.
  // Actually, we don't have direct access to its internal state without mounting its provider or just using it.
  // It returns filtered cards, but let's just use it to count total words in progress.
  // For a real production app, we might want a dedicated stats hook, but this works.

  // The setup hook might trigger state updates, so we'll just extract what we can safely.
  // If useGrammarProgress provides loading state, we wait for it.
  const grammar = useGrammarProgress();

  const [isEditingName, setIsEditingName] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profileEditorRef = useRef<HTMLElement>(null)

  // Derived Stats
  const activitySummary = useMemo(() => summarizeLearningActivity(ledger, {
    now: new Date(),
    dueReviewWordsNow: 0,
    goals: {
      dailyVocabularyGoal: preferences.dailyVocabularyGoal,
      dailyPracticeMinutes: preferences.dailyPracticeMinutes,
    },
  }), [ledger, preferences.dailyPracticeMinutes, preferences.dailyVocabularyGoal])
  const weeklyActivity = useMemo(
    () => summarizeWeeklyActivity(ledger.events),
    [ledger.events],
  )
  const streak = activitySummary.streakDays

  const vocabLearned = useMemo(() => {
    try {
      const progress = loadProgress();
      return progress.learnedWordIds.length;
    } catch { return 0; }
  }, []);

  const grammarTopics = grammar.progress?.topics
  const grammarMastery = useMemo(() => {
    if (!grammarTopics) return 0;
    const topics = Object.values(grammarTopics);
    if (topics.length === 0) return 0;
    const mastered = topics.filter(t => t.status === "mastered").length;
    return Math.round((mastered / Math.max(topics.length, 1)) * 100);
  }, [grammarTopics]);


  if (isProfileLoading || !profile) {
    return (
      <PageContainer className="py-12 sm:py-20 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-ink-secondary text-sm font-medium">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </PageContainer>
    )
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !profile) return

    const trimmedName = displayName.trim()
    if (!trimmedName) {
      setNameError("กรุณากรอกชื่อของคุณ")
      return
    }

    setNameError(null)
    setIsSaving(true)
    const success = await updateProfile(user.id, { display_name: trimmedName })
    setIsSaving(false)

    if (success) {
      setProfile({ ...profile, display_name: trimmedName })
      setIsEditingName(false)
    } else {
      setNameError("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    }
  }

  function startEditName() {
    setDisplayName(profile?.display_name || "")
    setNameError(null)
    setIsEditingName(true)
    profileEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setAvatarError(null)

    if (
      !AVATAR_MIME_TYPES.includes(
        file.type as (typeof AVATAR_MIME_TYPES)[number],
      )
    ) {
      setAvatarError("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP")
      e.target.value = ""
      return
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB")
      e.target.value = ""
      return
    }

    setIsUploadingAvatar(true)
    try {
      const publicUrl = await uploadAvatar(file, user.id)
      if (!publicUrl) {
        setAvatarError("อัปโหลดรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
        return
      }

      const success = await updateProfile(user.id, { avatar_url: publicUrl })
      if (success && profile) {
        setProfile({ ...profile, avatar_url: publicUrl })
      } else {
        setAvatarError("บันทึกรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
      }
    } catch {
      setAvatarError("อัปโหลดรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleDeleteAvatar() {
    if (!user || !profile || !profile.avatar_url) return
    if (!window.confirm("คุณต้องการลบรูปโปรไฟล์ใช่หรือไม่?")) return

    setIsUploadingAvatar(true)

    // 1. Delete physical file from storage
    await deleteAvatar(profile.avatar_url, user.id)

    // 2. Clear database record
    const success = await updateProfile(user.id, { avatar_url: null })
    setIsUploadingAvatar(false)

    if (success) {
      setProfile({ ...profile, avatar_url: null })
      setAvatarError(null)
    } else {
      setAvatarError("ลบรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    }
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-12">
      {/* 1. Header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border/60">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-center">
          <h1 className="text-base font-bold text-ink">{t("profile.title")}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4">

        {/* 2. Profile Header */}
        <section ref={profileEditorRef} className="flex flex-col items-center text-center pt-6 pb-4">
          <div className="relative group">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-soft text-primary flex items-center justify-center text-3xl font-bold ring-4 ring-primary/10 overflow-hidden"
              aria-busy={isUploadingAvatar}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`รูปโปรไฟล์ของ ${profile.display_name || "Mellow Learner"}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(profile.display_name?.trim() || "Mellow Learner")
              )}

              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 p-2.5 bg-white border border-border rounded-full text-ink-secondary hover:text-primary hover:border-primary transition-colors disabled:opacity-50 z-10"
              aria-label="เปลี่ยนรูปโปรไฟล์"
            >
              <Camera className="w-4 h-4" />
            </button>

            {profile.avatar_url && (
              <button
                onClick={handleDeleteAvatar}
                disabled={isUploadingAvatar}
                className="absolute top-0 right-0 p-2 bg-white border border-border rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 z-10"
                aria-label="ลบรูปโปรไฟล์"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept={AVATAR_MIME_TYPES.join(",")}
              aria-label="เลือกรูปโปรไฟล์"
              className="hidden"
            />
          </div>
          {avatarError && (
            <p className="mt-3 text-sm font-medium text-red-600" role="alert">
              {avatarError}
            </p>
          )}

          <div className="mt-4 w-full max-w-sm flex flex-col items-center text-center">
            {isEditingName ? (
              <div className="flex flex-col items-center mt-1 w-full">
                <form onSubmit={handleSaveName} className="flex items-center gap-2 w-full justify-center">
                  <input
                    type="text"
                    required
                    autoFocus
                    aria-label="ชื่อของคุณ"
                    className={`w-48 rounded-xl border px-4 py-2 text-center text-lg font-bold text-ink outline-none transition-all focus:ring-2 ${
                      nameError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-border focus:border-primary focus:ring-primary-soft"
                    }`}
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value)
                      if (nameError) setNameError(null)
                    }}
                    disabled={isSaving}
                    placeholder="ชื่อของคุณ"
                  />
                  <button
                    type="submit"
                    disabled={isSaving || !displayName.trim()}
                    className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  </button>
                </form>
                {nameError && (
                  <p className="text-red-500 text-xs font-medium mt-2 animate-in fade-in slide-in-from-top-1">
                    {nameError}
                  </p>
                )}
              </div>
            ) : (
              <div className="relative inline-flex items-center justify-center group">
                <h2 className="text-xl font-bold text-ink tracking-tight">{profile.display_name || "Mellow Learner"}</h2>
                <button
                  onClick={startEditName}
                  className="absolute -right-8 p-1.5 rounded-lg text-ink-secondary/60 hover:text-ink-secondary hover:bg-slate-100 transition-colors"
                  aria-label="Edit name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-ink-secondary text-sm mt-0.5">{profile.email}</p>
            {profile.role && (
              <div className="mt-1 text-xs text-ink-secondary">
                {profile.role}
              </div>
            )}
          </div>
        </section>

        {/* 3. Learning Stats */}
        <section className="grid grid-cols-3 gap-0 border-y border-border/40 py-4">
          {[
            { imageSrc: "/stat-streak.png", value: streak, label: "วันต่อเนื่อง" },
            { imageSrc: "/stat-vocab.png", value: vocabLearned, label: "คำศัพท์ที่เรียน" },
            { imageSrc: "/stat-accuracy.png", value: `${grammarMastery}%`, label: "ความแม่นยำ" },
          ].map(({ imageSrc, value, label }, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-1.5 py-1 ${
                i < 2 ? "border-r border-border/40" : ""
              }`}
            >
              <img src={imageSrc} alt={label} className="w-9 h-9 object-contain" />
              <p className="text-xl font-bold text-ink tabular-nums leading-none">{value}</p>
              <p className="text-xs font-medium text-ink-secondary text-center leading-tight">{label}</p>
            </div>
          ))}
        </section>

        {/* 4. Weekly Activity */}
        <section className="pt-5 pb-5">
          <h3 className="font-semibold text-sm text-ink mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {t("profile.weeklyActivity")}
          </h3>

          <WeeklyActivityChart
            days={weeklyActivity}
            language={preferences.language}
          />
        </section>

        {/* 5. Account Settings */}
        <div className="border-t border-border/40 pt-5 pb-1">
          <ProfileSettings onEditPersonalData={startEditName} />
        </div>

        {/* 6. Security and logout */}
        <div className="border-t border-border/40 pt-5">
          <AccountSecurity email={profile.email ?? user?.email ?? ""} userId={profile.id} />
        </div>

      </main>
    </div>
  )
}
