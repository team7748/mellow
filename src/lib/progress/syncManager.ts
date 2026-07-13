import type { UserProgress } from "../../types/vocabulary";
import { getGuestClaimMarkerKey } from "./progressKeys";
import { getGuestVocabularyProgress, loadLocalVocabularyProgress, saveLocalVocabularyProgress } from "./vocabularyLocalStorage";
import { loadCloudVocabularyProgress, upsertCloudVocabularyProgress } from "./vocabularyCloudRepository";
import { mergeVocabularyProgress } from "./vocabularyMerge";

let activeUserId: string | null = null;
let generation: number = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

let isSyncing = false;
let pendingSync = false;
let retryCount = 0;
const MAX_RETRIES = 3;

export function getActiveUserId() {
  return activeUserId;
}

function isProgressEmpty(progress: UserProgress | null): boolean {
  if (!progress) return true;
  return progress.learnedWordIds.length === 0 && Object.keys(progress.words).length === 0;
}

export function handleSignOut() {
  generation++;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  isSyncing = false;
  pendingSync = false;
  retryCount = 0;
  activeUserId = null;
}

export async function handleSignIn(userId: string) {
  // If the same user signs in again quickly, do nothing
  if (activeUserId === userId) return;

  handleSignOut(); // Reset current state
  activeUserId = userId;
  const currentGen = generation;

  try {
    // 1. Load Local User Progress
    const localUser = loadLocalVocabularyProgress(userId);

    // 2. Load Cloud Progress
    const cloudUser = await loadCloudVocabularyProgress(userId);
    if (currentGen !== generation) return;

    // 3. Merge User Local + Cloud
    const mergedUser = mergeVocabularyProgress(localUser, cloudUser);

    // 4. Check Guest Progress and decide whether to merge
    const claimMarkerKey = getGuestClaimMarkerKey();
    const guestClaimedBy = localStorage.getItem(claimMarkerKey);
    const guestProgress = getGuestVocabularyProgress();

    let finalProgress = mergedUser;

    // Only merge guest if User is entirely empty AND Guest isn't claimed
    if (isProgressEmpty(mergedUser) && !isProgressEmpty(guestProgress) && !guestClaimedBy) {
      finalProgress = mergeVocabularyProgress(mergedUser, guestProgress);
      // Mark guest as claimed by this user
      localStorage.setItem(claimMarkerKey, userId);
    }

    // Save back to Local and Cloud
    saveLocalVocabularyProgress(userId, finalProgress);
    await upsertCloudVocabularyProgress(userId, finalProgress);
  } catch (err) {
    console.error("Error during sign in sync", err);
  }
}

export function scheduleSync(userId: string) {
  if (userId !== activeUserId) return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  const currentGen = generation;

  debounceTimer = setTimeout(async () => {
    if (currentGen !== generation || activeUserId !== userId) return;
    debounceTimer = null;

    if (isSyncing) {
      pendingSync = true;
      return;
    }

    await performSync(userId, currentGen);
  }, 2000); // 2 second debounce
}

async function performSync(userId: string, currentGen: number) {
  isSyncing = true;
  pendingSync = false;

  try {
    // PULL
    const local = loadLocalVocabularyProgress(userId);
    const cloud = await loadCloudVocabularyProgress(userId);
    if (currentGen !== generation || activeUserId !== userId) {
      isSyncing = false;
      return;
    }

    // MERGE
    const merged = mergeVocabularyProgress(local, cloud);

    // PUSH to Local
    saveLocalVocabularyProgress(userId, merged);

    // PUSH to Cloud
    const success = await upsertCloudVocabularyProgress(userId, merged);
    
    if (currentGen !== generation) {
      isSyncing = false;
      return; // Stop processing if generation changed during upsert
    }

    if (!success) {
      throw new Error("Upsert failed");
    }

    retryCount = 0; // Success, reset retries
  } catch (err) {
    console.error("Sync failed", err);
    if (retryCount < MAX_RETRIES && currentGen === generation && activeUserId === userId) {
      retryCount++;
      pendingSync = true; // Retry on next cycle
    }
  } finally {
    isSyncing = false;
    
    if (pendingSync && currentGen === generation && activeUserId === userId) {
      // Run again if there was a pending sync requested while we were syncing
      scheduleSync(userId);
    }
  }
}

// Optionally, handle online event to trigger pending syncs
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (activeUserId && (pendingSync || retryCount > 0)) {
      scheduleSync(activeUserId);
    }
  });
}
