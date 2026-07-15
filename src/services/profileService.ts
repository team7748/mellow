import { supabase } from "../lib/supabaseClient"
import { assertAuthenticatedUser } from "../lib/authUserScope"
import type { UserProfile } from "../types/profile"

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
export const AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

const avatarExtensionByMimeType: Record<(typeof AVATAR_MIME_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

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

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  try {
    await assertAuthenticatedUser(userId)

    if (
      file.size > AVATAR_MAX_BYTES ||
      !AVATAR_MIME_TYPES.includes(
        file.type as (typeof AVATAR_MIME_TYPES)[number],
      )
    ) {
      return null
    }

    const fileExtension = avatarExtensionByMimeType[
      file.type as (typeof AVATAR_MIME_TYPES)[number]
    ]
    const fileName = `${crypto.randomUUID()}.${fileExtension}`
    const filePath = `${userId}/${fileName}`
    const avatarBucket = supabase.storage.from("avatars")

    const { error: uploadError } = await avatarBucket.upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError)
      return null
    }

    const {
      data: { publicUrl },
    } = avatarBucket.getPublicUrl(filePath)

    return publicUrl || null
  } catch (err) {
    console.error("Unexpected error uploading avatar:", err)
    return null
  }
}

export async function deleteAvatar(avatarUrl: string, userId: string): Promise<boolean> {
  try {
    await assertAuthenticatedUser(userId)

    // Extract file path from URL
    const bucketPath = "avatars/"
    const pathIndex = avatarUrl.indexOf(bucketPath)
    if (pathIndex === -1) return false

    const filePath = avatarUrl.substring(pathIndex + bucketPath.length)

    // Safety check to ensure users can only delete from their own folder
    if (!filePath.startsWith(`${userId}/`)) {
      console.error("Attempted to delete avatar from another user's folder")
      return false
    }

    const { error } = await supabase.storage.from("avatars").remove([filePath])

    if (error) {
      console.error("Error deleting avatar from storage:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Unexpected error deleting avatar:", err)
    return false
  }
}
