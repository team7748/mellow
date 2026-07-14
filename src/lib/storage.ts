import type { UserProgress, WordProgress, WordStatus } from "../types/vocabulary"
import { getActiveUserId, scheduleSync } from "./progress/syncManager"
import {
  loadLocalVocabularyProgress,
  saveLocalVocabularyProgress,
  clearLocalVocabularyProgress
} from "./progress/vocabularyLocalStorage"
import { normalizeUserProgress } from "./progress/vocabularyNormalizer"

export const PROGRESS_EXPORT_FILENAME = "vocabulary-progress.json"
export const PROGRESS_STORAGE_KEY = "thai-english-vocab-progress"

export type ProgressImportResult =
  | { ok: true; progress: UserProgress }
  | { ok: false; error: string }

const wordStatuses: WordStatus[] = ["new", "learning", "review", "mastered"]
const wordDifficulties: NonNullable<WordProgress["difficulty"]>[] = ["forgot", "medium", "known"]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isWordProgress(value: unknown): value is WordProgress {
  if (!isRecord(value)) return false

  return (
    typeof value.wordId === "string" &&
    wordStatuses.includes(value.status as WordStatus) &&
    (value.difficulty === undefined || wordDifficulties.includes(value.difficulty as NonNullable<WordProgress["difficulty"]>)) &&
    typeof value.correctCount === "number" &&
    Number.isFinite(value.correctCount) &&
    typeof value.wrongCount === "number" &&
    Number.isFinite(value.wrongCount) &&
    isNullableString(value.lastStudiedAt) &&
    isNullableString(value.nextReviewAt) &&
    typeof value.updatedAt === "string"
  )
}

function isUserProgress(value: unknown): value is UserProgress {
  if (!isRecord(value)) return false
  if (!Array.isArray(value.learnedWordIds)) return false
  if (!value.learnedWordIds.every((wordId) => typeof wordId === "string")) return false
  if (!isRecord(value.words)) return false
  if (!Object.values(value.words).every(isWordProgress)) return false

  return isNullableString(value.updatedAt)
}

export function createEmptyProgress(): UserProgress {
  return {
    learnedWordIds: [],
    words: {},
    updatedAt: null,
  }
}

export function loadProgress(): UserProgress {
  return loadLocalVocabularyProgress(getActiveUserId())
}

export function saveProgress(progress: UserProgress) {
  const userId = getActiveUserId()
  saveLocalVocabularyProgress(userId, progress)
  if (userId) {
    scheduleSync(userId)
  }
}

export function clearProgress() {
  clearLocalVocabularyProgress(getActiveUserId())
}

export function serializeProgress(progress = loadProgress()) {
  return JSON.stringify(progress, null, 2)
}

export function parseProgressImport(rawValue: string): ProgressImportResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawValue)
  } catch {
    return {
      ok: false,
      error: "ไฟล์ progress ไม่ใช่ JSON ที่อ่านได้",
    }
  }

  if (!isUserProgress(parsed)) {
    return {
      ok: false,
      error: "รูปแบบไฟล์ progress ไม่ถูกต้อง",
    }
  }

  return {
    ok: true,
    progress: normalizeUserProgress(parsed),
  }
}

export function importProgress(rawValue: string): ProgressImportResult {
  const result = parseProgressImport(rawValue)

  if (!result.ok) {
    return result
  }

  const userId = getActiveUserId()
  saveLocalVocabularyProgress(userId, result.progress, { preserveUpdatedAt: true })
  if (userId) {
    scheduleSync(userId)
  }

  return result
}
