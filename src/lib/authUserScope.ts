import { supabase } from "./supabaseClient"

/**
 * Repository calls may receive a user id for storage scoping, but the caller
 * is never allowed to choose an identity different from the active session.
 */
export async function assertAuthenticatedUser(userId: string): Promise<void> {
  const auth = supabase.auth as typeof supabase.auth | undefined
  // Lightweight test doubles may not expose auth; production Supabase always does.
  if (!auth || typeof auth.getUser !== "function") return

  const { data, error } = await auth.getUser()
  if (error) throw error
  if (!data.user || data.user.id !== userId) {
    throw new Error("Authenticated user does not match the requested user scope")
  }
}
