export const FLASHCARD_PAGE_SESSION_KEY = "vocabulary_flashcard_active_session"
export const FLASHCARD_PROGRESS_SESSION_KEY = "vocabulary_flashcard_progress"
export const QUIZ_PAGE_SESSION_KEY = "vocabulary_quiz_active_session"
export const QUIZ_PROGRESS_SESSION_KEY = "vocabulary_quiz_progress"

export function savePracticeSession<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage may be unavailable or full; practice can continue in memory.
  }
}

export function loadPracticeSession<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function clearPracticeSession(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // localStorage may be unavailable in some environments.
  }
}
