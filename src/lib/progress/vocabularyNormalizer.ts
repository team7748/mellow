import type { UserProgress, WordProgress, WordStatus } from "../../types/vocabulary";

// Helper for handling potentially broken dates
function toTimestamp(value?: string | null): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeWordStatus(status: unknown): WordStatus {
  const validStatuses: WordStatus[] = ["new", "learning", "review", "mastered"];
  if (typeof status === "string" && validStatuses.includes(status as WordStatus)) {
    return status as WordStatus;
  }
  return "new";
}

export function normalizeWordProgress(record: any, wordId: string): WordProgress {
  // Gracefully handle missing or broken data
  const safeCorrect = typeof record?.correctCount === "number" && Number.isFinite(record.correctCount) ? record.correctCount : 0;
  const safeWrong = typeof record?.wrongCount === "number" && Number.isFinite(record.wrongCount) ? record.wrongCount : 0;
  
  // Use existing updatedAt, fallback to lastStudiedAt, then to epoch 0
  const baseTime = record?.updatedAt ?? record?.lastStudiedAt;
  const finalUpdatedAt = toTimestamp(baseTime) > 0 ? new Date(toTimestamp(baseTime)).toISOString() : new Date(0).toISOString();

  return {
    wordId: typeof record?.wordId === "string" ? record.wordId : wordId,
    status: normalizeWordStatus(record?.status),
    difficulty: record?.difficulty !== undefined && ["forgot", "medium", "known"].includes(record.difficulty) ? (record.difficulty as "forgot" | "medium" | "known") : undefined,
    correctCount: safeCorrect,
    wrongCount: safeWrong,
    lastStudiedAt: typeof record?.lastStudiedAt === "string" ? record.lastStudiedAt : null,
    nextReviewAt: typeof record?.nextReviewAt === "string" ? record.nextReviewAt : null,
    updatedAt: finalUpdatedAt,
  };
}

export function normalizeUserProgress(data: any): UserProgress {
  if (!data || typeof data !== "object") {
    return { learnedWordIds: [], words: {}, updatedAt: null };
  }

  const learnedWordIds = Array.isArray(data.learnedWordIds)
    ? data.learnedWordIds.filter((id: any) => typeof id === "string")
    : [];

  const rawWords = data.words && typeof data.words === "object" ? data.words : {};
  const normalizedWords: Record<string, WordProgress> = {};

  for (const [wordId, record] of Object.entries(rawWords)) {
    normalizedWords[wordId] = normalizeWordProgress(record, wordId);
  }

  return {
    learnedWordIds,
    words: normalizedWords,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
  };
}
