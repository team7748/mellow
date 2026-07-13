import type { UserProgress } from "../../types/vocabulary";
import { getVocabularyStorageKey } from "./progressKeys";
import { normalizeUserProgress } from "./vocabularyNormalizer";

function createEmptyProgress(): UserProgress {
  return {
    learnedWordIds: [],
    words: {},
    updatedAt: null,
  };
}

export function loadLocalVocabularyProgress(userId: string | null | undefined): UserProgress {
  const key = getVocabularyStorageKey(userId);
  const rawValue = localStorage.getItem(key);

  if (!rawValue) {
    return createEmptyProgress();
  }

  try {
    const parsed = JSON.parse(rawValue);
    return normalizeUserProgress(parsed);
  } catch (err) {
    console.error(`Failed to parse local vocabulary progress for key: ${key}`, err);
    return createEmptyProgress();
  }
}

export function saveLocalVocabularyProgress(userId: string | null | undefined, progress: UserProgress): void {
  const key = getVocabularyStorageKey(userId);
  progress.updatedAt = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(progress));
}

export function clearLocalVocabularyProgress(userId: string | null | undefined): void {
  const key = getVocabularyStorageKey(userId);
  localStorage.removeItem(key);
}

// Function to specifically get the guest's progress for merging purposes
export function getGuestVocabularyProgress(): UserProgress | null {
  const key = getVocabularyStorageKey(null);
  const rawValue = localStorage.getItem(key);
  if (!rawValue) return null;
  
  try {
    return normalizeUserProgress(JSON.parse(rawValue));
  } catch {
    return null;
  }
}
