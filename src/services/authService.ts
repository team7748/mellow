import { supabase } from "../lib/supabaseClient"
import type { Session, User } from "@supabase/supabase-js"
import { createProfile, fetchProfile } from "./profileService"

export function translateAuthError(error: any): string {
  if (!error) {
    return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
  }

  const code = error.code?.toLowerCase();
  const status = error.status;
  const message = error.message?.toLowerCase() ?? "";

  // Prefer stable code first
  switch (code) {
    case "invalid_credentials":
    case "invalid_grant":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";

    case "email_not_confirmed":
      return "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ";

    case "user_already_exists":
    case "email_exists":
      return "อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบแทน";

    case "weak_password":
      return "รหัสผ่านยังไม่ปลอดภัยพอ กรุณาตั้งรหัสผ่านให้แข็งแรงขึ้น";

    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "มีการพยายามหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";
  }

  // Then use HTTP status
  if (status === 400) {
    return "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
  }

  if (status === 401 || status === 403) {
    return "คุณไม่มีสิทธิ์เข้าถึง หรือข้อมูลเข้าสู่ระบบไม่ถูกต้อง";
  }

  if (status && status >= 500) {
    return "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง";
  }

  // Last fallback by message
  if (message.includes("invalid login credentials")) {
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  }

  if (message.includes("email not confirmed")) {
    return "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ";
  }

  if (message.includes("user already registered")) {
    return "อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบแทน";
  }

  if (message.includes("network")) {
    return "เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่";
  }

  return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        }
      }
    })

    if (error) throw error

    // Supabase will log them in immediately if email confirmations are off.
    // If they are on, data.user is returned but session is null until they click the link.
    if (data.user && !data.session) {
      return { success: true, message: "กรุณายืนยันอีเมลของคุณเพื่อทำรายการต่อ", user: data.user }
    }

    // We rely on Supabase Database Triggers to auto-create the profile.
    // The client doesn't need to manually insert the profile here.

    return { success: true, message: "สมัครสมาชิกสำเร็จ", user: data.user }
  } catch (error) {
    return { success: false, error: translateAuthError(error) }
  }
}

export async function loginWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      // Ensure profile exists
      const profile = await fetchProfile(data.user.id)
      if (!profile) {
        const displayName = data.user.user_metadata?.display_name || email.split("@")[0]
        await createProfile(data.user.id, data.user.email, displayName)
      }
    }

    return { success: true, session: data.session, user: data.user }
  } catch (error) {
    return { success: false, error: translateAuthError(error) }
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // Note: We intentionally do NOT clear localStorage here to preserve guest data.
    return { success: true }
  } catch (error) {
    return { success: false, error: translateAuthError(error) }
  }
}

export async function resetPasswordForEmail(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#auth?type=reset`,
    })
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: translateAuthError(error) }
  }
}

export async function getSession(): Promise<{ session: Session | null; user: User | null }> {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error("Error getting session:", error)
    return { session: null, user: null }
  }
  return { session, user: session?.user || null }
}
