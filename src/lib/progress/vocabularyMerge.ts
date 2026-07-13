import type { UserProgress, WordProgress } from "../../types/vocabulary";
import { normalizeUserProgress } from "./vocabularyNormalizer";

function parseTimestamp(val?: string | null): number {
  if (!val) return 0;
  const t = Date.parse(val);
  return Number.isNaN(t) ? 0 : t;
}

export function mergeVocabularyProgress(localRaw: any, cloudRaw: any): UserProgress {
  const local = normalizeUserProgress(localRaw);
  const cloud = normalizeUserProgress(cloudRaw);

  const mergedWords: Record<string, WordProgress> = {};
  const allWordIds = new Set([...Object.keys(local.words), ...Object.keys(cloud.words)]);

  for (const wordId of allWordIds) {
    const localWord = local.words[wordId];
    const cloudWord = cloud.words[wordId];

    if (localWord && !cloudWord) {
      mergedWords[wordId] = localWord;
    } else if (!localWord && cloudWord) {
      mergedWords[wordId] = cloudWord;
    } else if (localWord && cloudWord) {
      const localTime = parseTimestamp(localWord.updatedAt);
      const cloudTime = parseTimestamp(cloudWord.updatedAt);

      if (localTime > cloudTime) {
        mergedWords[wordId] = localWord;
      } else if (cloudTime > localTime) {
        mergedWords[wordId] = cloudWord;
      } else {
        // Tie-breaker: Deterministically pick local if timestamps are exactly equal
        mergedWords[wordId] = localWord;
      }
    }
  }

  // Merge learnedWordIds (Set union)
  const mergedLearnedIds = Array.from(new Set([...local.learnedWordIds, ...cloud.learnedWordIds]));

  // Global updatedAt is max of both global updatedAts
  const localGlobalTime = parseTimestamp(local.updatedAt);
  const cloudGlobalTime = parseTimestamp(cloud.updatedAt);
  const globalUpdatedAt = localGlobalTime >= cloudGlobalTime ? local.updatedAt : cloud.updatedAt;

  return {
    learnedWordIds: mergedLearnedIds,
    words: mergedWords,
    updatedAt: globalUpdatedAt || new Date().toISOString(),
  };
}
