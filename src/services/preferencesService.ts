import { assertAuthenticatedUser } from "../lib/authUserScope"
import { supabase } from "../lib/supabaseClient"
import {
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
  type UserPreferences,
  type UserPreferencesRow,
} from "../types/preferences"

const USER_PREFERENCES_COLUMNS =
  "user_id,daily_vocabulary_goal,daily_practice_minutes,reminder_enabled,reminder_time,timezone,language,speech_locale,speech_voice_uri,speech_rate,speech_auto_play"

export function rowToPreferences(row: UserPreferencesRow): UserPreferences {
  return normalizeUserPreferences({
    dailyVocabularyGoal: row.daily_vocabulary_goal,
    dailyPracticeMinutes: row.daily_practice_minutes,
    reminderEnabled: row.reminder_enabled,
    reminderTime: row.reminder_time,
    timezone: row.timezone,
    language: row.language,
    speechLocale: row.speech_locale,
    speechVoiceUri: row.speech_voice_uri,
    speechRate: Number(row.speech_rate),
    speechAutoPlay: row.speech_auto_play,
  })
}

export function preferencesToRow(
  userId: string,
  preferences: UserPreferences,
): UserPreferencesRow {
  const normalized = normalizeUserPreferences(preferences)
  return {
    user_id: userId,
    daily_vocabulary_goal: normalized.dailyVocabularyGoal,
    daily_practice_minutes: normalized.dailyPracticeMinutes,
    reminder_enabled: normalized.reminderEnabled,
    reminder_time: normalized.reminderTime,
    timezone: normalized.timezone,
    language: normalized.language,
    speech_locale: normalized.speechLocale,
    speech_voice_uri: normalized.speechVoiceUri,
    speech_rate: normalized.speechRate,
    speech_auto_play: normalized.speechAutoPlay,
  }
}

export async function fetchUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  await assertAuthenticatedUser(userId)
  const { data, error } = await supabase
    .from("user_preferences")
    .select(USER_PREFERENCES_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return { ...DEFAULT_USER_PREFERENCES }
  return rowToPreferences(data as UserPreferencesRow)
}

export async function upsertUserPreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<UserPreferences> {
  await assertAuthenticatedUser(userId)
  const rowPayload = preferencesToRow(userId, preferences)
  
  // Split into update first, then insert if not found.
  // This avoids the 'permission denied for column user_id' error during upsert
  // because the migration only granted UPDATE on specific columns, excluding user_id.
  const { user_id, ...updatePayload } = rowPayload
  
  const { data: updateData, error: updateError } = await supabase
    .from("user_preferences")
    .update(updatePayload)
    .eq("user_id", userId)
    .select(USER_PREFERENCES_COLUMNS)
    .maybeSingle()

  if (updateError) throw updateError

  if (updateData) {
    return rowToPreferences(updateData as UserPreferencesRow)
  }

  // If no row was updated, it means the user preferences don't exist yet, so insert.
  const { data: insertData, error: insertError } = await supabase
    .from("user_preferences")
    .insert(rowPayload)
    .select(USER_PREFERENCES_COLUMNS)
    .single()

  if (insertError) throw insertError
  return rowToPreferences(insertData as UserPreferencesRow)
}
