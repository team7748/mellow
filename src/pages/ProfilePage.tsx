import { useState, useMemo, useRef } from "react"
import { useAuth } from "../hooks/useAuth"
import { useProfile } from "../hooks/useProfile"
import { useLearningActivityLedger } from "../hooks/useLearningActivityLedger"
import { useGrammarProgress } from "../hooks/useGrammarProgress"
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} from "../services/profileService"
import { logout } from "../services/authService"
import { loadProgress } from "../lib/storage"
import { PageContainer } from "../components/layout/PageContainer"
import {
  Loader2, ChevronRight,
  Settings, Bell, Target, TrendingUp,
  Pencil, LogOut, CheckCircle2,
  Globe, Camera, Trash2
} from "lucide-react"
import type { LearningActivityEvent } from "../lib/activity/activityTypes"

// --- Helper Functions ---
type DatedActivity = Pick<LearningActivityEvent, "localDate">

function parseLocalDate(localDate: string): Date {
  const [year, month, day] = localDate.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function calculateStreak(events: DatedActivity[]) {
  const dates = [...new Set(events.map(e => e.localDate))].sort((a,b) => b.localeCompare(a));
  if (dates.length === 0) return 0;

  const today = new Date();
  const todayStr = today.toLocaleDateString('sv-SE'); // YYYY-MM-DD local
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('sv-SE');

  if (!dates.includes(todayStr) && !dates.includes(yesterdayStr)) return 0;

  let streak = 0;
  const d = dates.includes(todayStr) ? new Date() : yesterday;

  while (true) {
    const dStr = d.toLocaleDateString('sv-SE');
    if (dates.includes(dStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function calculateWeeklyActivity(
  events: DatedActivity[],
  currentDate = new Date(),
) {
  const counts = [0,0,0,0,0,0,0];
  const today = new Date(currentDate);
  today.setHours(0,0,0,0);

  events.forEach(e => {
    const eventDate = parseLocalDate(e.localDate);
    const diffTime = today.getTime() - eventDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      counts[6 - diffDays] += 1; // 6 is today, 0 is 6 days ago
    }
  });
  return counts;
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.substring(0, 2).toUpperCase();
}

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, isLoading: isProfileLoading, setProfile } = useProfile()

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

  // Derived Stats
  const streak = useMemo(() => calculateStreak(ledger.events), [ledger.events]);
  const weeklyActivity = useMemo(() => calculateWeeklyActivity(ledger.events), [ledger.events]);
  const maxWeeklyActivity = Math.max(...weeklyActivity, 1);
  const totalEvents = ledger.events.length;

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
    <div className="min-h-screen bg-white pb-20 sm:pb-12">
      {/* 1. Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border/60">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-center">
          <h1 className="text-base font-bold text-ink">โปรไฟล์</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-8 space-y-8">

        {/* 2. Profile Header */}
        <section className="flex flex-col items-center text-center">
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
              className="absolute bottom-0 right-0 p-2 bg-white border border-border rounded-full text-ink-secondary shadow-sm hover:text-primary hover:border-primary transition-colors disabled:opacity-50 z-10"
              aria-label="เปลี่ยนรูปโปรไฟล์"
            >
              <Camera className="w-4 h-4" />
            </button>

            {profile.avatar_url && (
              <button
                onClick={handleDeleteAvatar}
                disabled={isUploadingAvatar}
                className="absolute top-0 right-0 p-1.5 bg-white border border-border rounded-full text-red-500 shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 z-10"
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
                  className="absolute -right-7 p-1 rounded-lg text-ink-secondary/40 opacity-0 group-hover:opacity-100 transition-opacity hover:text-ink-secondary hover:bg-slate-100"
                  aria-label="Edit name"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-ink-secondary text-sm mt-1">{profile.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-ink-secondary tracking-widest uppercase">
              {profile.role}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* 3. Learning Stats */}
        <section className="grid grid-cols-3 gap-1">
          {[
            { imageSrc: "/stat-streak.png", value: streak, label: "วันต่อเนื่อง" },
            { imageSrc: "/stat-vocab.png", value: vocabLearned, label: "คำศัพท์ที่เรียน" },
            { imageSrc: "/stat-accuracy.png", value: `${grammarMastery}%`, label: "ความแม่นยำ" },
          ].map(({ imageSrc, value, label }, i) => (
            <div key={i} className="flex flex-col items-center py-4">
              <img src={imageSrc} alt={label} className="w-9 h-9 object-contain mb-2" />
              <p className="text-2xl font-bold text-ink tabular-nums tracking-tight">{value}</p>
              <p className="text-[11px] font-medium text-ink-secondary mt-1 text-center leading-tight">{label}</p>
            </div>
          ))}
        </section>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* 4. Weekly Activity */}
        <section>
          <h3 className="font-semibold text-sm text-ink mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            กิจกรรมย้อนหลัง 7 วัน
          </h3>

          <div className="flex items-end justify-between h-24 gap-2">
            {weeklyActivity.map((count, i) => {
              const heightPercentage = maxWeeklyActivity === 0 ? 8 : Math.max(8, (count / maxWeeklyActivity) * 100);
              const isToday = i === 6;
              const dayLabel = ['จ','อ','พ','พฤ','ศ','ส','อา'][(new Date().getDay() + i + 1) % 7];
              return (
                <button
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1.5 group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
                  aria-label={`${count} กิจกรรม`}
                >
                  <div className="w-full relative flex items-end justify-center h-full">
                    <div
                      className={`w-full rounded-md transition-all duration-500 ${count > 0 ? (isToday ? 'bg-primary' : 'bg-primary/20') : 'bg-slate-100 group-hover:bg-slate-200/80 group-focus:bg-slate-200/80'}`}
                      style={{ height: `${heightPercentage}%` }}
                    />
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 text-xs font-bold text-ink bg-white px-1.5 py-0.5 rounded border border-border/60 pointer-events-none transition-opacity z-10 shadow-sm">
                      {count}
                    </div>
                  </div>
                  <span className={`text-[11px] ${isToday ? 'text-primary font-bold' : 'text-ink-secondary font-medium'}`}>
                    {dayLabel}
                  </span>
                </button>
              )
            })}
          </div>
          {totalEvents === 0 && (
            <p className="text-sm text-center text-ink-secondary mt-4">ยังไม่มีกิจกรรมในสัปดาห์นี้ มาเริ่มเรียนกันเถอะ!</p>
          )}
        </section>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* 5. Account Settings */}
        <section>
          <h3 className="font-semibold text-sm text-ink mb-2">การตั้งค่า</h3>
          <div className="rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40">

            {[
              { icon: Target, title: "เป้าหมายการเรียน", desc: "ตั้งเป้าหมายคำศัพท์และเวลาต่อวัน" },
              { icon: Bell, title: "การแจ้งเตือน", desc: "จัดการอีเมลและการเตือนทบทวน" },
              { icon: Globe, title: "ภาษา (Language)", desc: "เลือกภาษาของแอปพลิเคชัน" },
              { icon: Settings, title: "จัดการข้อมูลส่วนตัว", desc: "รหัสผ่านและข้อมูลติดต่อ" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <button key={i} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-border/60 flex items-center justify-center text-ink-secondary group-hover:text-primary group-hover:border-primary/20 transition-colors">
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-ink">{title}</p>
                    <p className="text-xs text-ink-secondary mt-0.5">{desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-secondary/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}

          </div>
        </section>

        {/* 6. Logout */}
        <section className="pt-2 pb-8 flex justify-center">
          <button
            onClick={async () => await logout()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-red-500 font-medium hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </section>

      </main>
    </div>
  )
}
