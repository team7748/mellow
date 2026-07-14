import { supabase } from "../lib/supabaseClient"
import { assertAuthenticatedUser } from "../lib/authUserScope"
import type { UserProfile } from "../types/profile"

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    await assertAuthenticatedUser(userId)
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // Profile not found
      }
      console.error("Error fetching profile:", error)
      return null
    }

    return data as UserProfile
  } catch (err) {
    console.error("Unexpected error fetching profile:", err)
    return null
  }
}

export async function createProfile(
  userId: string,
  email: string | undefined,
  displayName: string
): Promise<UserProfile | null> {
  try {
    await assertAuthenticatedUser(userId)
    const { data, error } = await supabase
      .from("profiles")
      .insert([
        {
          id: userId,
          email: email || null,
          display_name: displayName,
          role: "user",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating profile:", error)
      return null
    }
    return data as UserProfile
  } catch (err) {
    console.error("Unexpected error creating profile:", err)
    return null
  }
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "role" | "created_at" | "updated_at">>
): Promise<boolean> {
  try {
    await assertAuthenticatedUser(userId)
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)

    if (error) {
      console.error("Error updating profile:", error)
      return false
    }
    return true
  } catch (err) {
    console.error("Unexpected error updating profile:", err)
    return false
  }
}
