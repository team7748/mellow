import { supabase } from "../supabaseClient";
import type { UserProgress } from "../../types/vocabulary";
import { normalizeUserProgress } from "./vocabularyNormalizer";

export async function loadCloudVocabularyProgress(userId: string): Promise<UserProgress | null> {
  try {
    const { data, error } = await supabase
      .from("vocabulary_progress")
      .select("data")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Record not found
      }
      throw error;
    }

    if (data && data.data) {
      const parsed = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
      return normalizeUserProgress(parsed);
    }
    return null;
  } catch (err) {
    console.error("Failed to load vocabulary progress from cloud:", err);
    return null;
  }
}

export async function upsertCloudVocabularyProgress(userId: string, progress: UserProgress): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    progress.updatedAt = now;
    
    const { error } = await supabase
      .from("vocabulary_progress")
      .upsert({
        user_id: userId,
        data: progress, // Supabase automatically handles JSON stringification if the column type is JSONB and SDK handles it
        updated_at: now
      }, { onConflict: "user_id" });

    if (error) {
      throw error;
    }
    return true;
  } catch (err) {
    console.error("Failed to upsert vocabulary progress to cloud:", err);
    return false;
  }
}
