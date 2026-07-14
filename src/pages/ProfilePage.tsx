import { useState } from "react"
import { useAuth } from "../hooks/useAuth"
import { useProfile } from "../hooks/useProfile"
import { updateProfile } from "../services/profileService"
import { logout } from "../services/authService"
import { PageContainer } from "../components/layout/PageContainer"
import { Button } from "../components/ui/Button"
import { Loader2, UserCircle } from "lucide-react"

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, isLoading, setProfile } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading || !profile) {
    return (
      <PageContainer className="py-12 sm:py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </PageContainer>
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    const success = await updateProfile(user.id, { display_name: displayName })
    setIsSaving(false)

    if (success) {
      setProfile({ ...profile!, display_name: displayName })
      setIsEditing(false)
    }
  }

  function startEdit() {
    setDisplayName(profile?.display_name || "")
    setIsEditing(true)
  }

  return (
    <PageContainer className="py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="surface-card p-6 sm:p-10">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary ring-1 ring-primary/20">
              <UserCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-DEFAULT">โปรไฟล์ของฉัน</h1>
              <p className="text-sm text-ink-secondary">จัดการข้อมูลส่วนตัวและการตั้งค่า</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">อีเมล</p>
              <p className="mt-1 text-base font-medium text-ink-DEFAULT">{profile.email}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">ชื่อที่แสดง</p>
              {isEditing ? (
                <form onSubmit={handleSave} className="mt-2 flex gap-3">
                  <input
                    type="text"
                    required
                    className="flex-1 rounded-lg border border-border px-4 py-2 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isSaving}
                  />
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "บันทึก"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    ยกเลิก
                  </Button>
                </form>
              ) : (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-base font-medium text-ink-DEFAULT">{profile.display_name || "ไม่มีชื่อ"}</p>
                  <button onClick={startEdit} className="text-sm font-semibold text-primary hover:underline">
                    แก้ไข
                  </button>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">บทบาท (Role)</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                {profile.role}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">วันที่สมัคร</p>
              <p className="mt-1 text-sm text-ink-DEFAULT">
                {new Date(profile.created_at).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-border flex justify-end">
            <Button
              variant="outline-danger"
              onClick={async () => {
                await logout()
              }}
            >
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
