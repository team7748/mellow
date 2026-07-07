import type { UserProgress, WordProgress, WordStatus } from "../types/vocabulary"

export const PROGRESS_STORAGE_KEY = "thai-english-vocab-progress"
export const PROGRESS_EXPORT_FILENAME = "vocabulary-progress.json"

export type ProgressImportResult =
  | { ok: true; progress: UserProgress }
  | { ok: false; error: string }

const wordStatuses: WordStatus[] = ["new", "learning", "review", "mastered"]

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
    typeof value.correctCount === "number" &&
    Number.isFinite(value.correctCount) &&
    typeof value.wrongCount === "number" &&
    Number.isFinite(value.wrongCount) &&
    isNullableString(value.lastStudiedAt) &&
    isNullableString(value.nextReviewAt)
  )
}

function isUserProgress(value: unknown): value is UserProgress {
  if (!isRecord(value)) return false
  if (!Array.isArray(value.learnedWordIds)) return false
  if (!value.learnedWordIds.every((wordId) => typeof wordId === "string")) {
    return false
  }
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
  const rawValue = localStorage.getItem(PROGRESS_STORAGE_KEY)

  if (!rawValue) {
    return createEmptyProgress()
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<UserProgress>

    return {
      learnedWordIds: Array.isArray(parsed.learnedWordIds)
        ? parsed.learnedWordIds
        : [],
      words: parsed.words && typeof parsed.words === "object" ? parsed.words : {},
      updatedAt: parsed.updatedAt ?? null,
    }
  } catch {
    return createEmptyProgress()
  }
}

export function saveProgress(progress: UserProgress) {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
}

export function clearProgress() {
  localStorage.removeItem(PROGRESS_STORAGE_KEY)
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
    progress: parsed,
  }
}

export function importProgress(rawValue: string): ProgressImportResult {
  const result = parseProgressImport(rawValue)

  if (!result.ok) {
    return result
  }

  saveProgress(result.progress)

  return result
}
