const STORAGE_KEY = "grammar-lesson-progress"

export type GrammarLessonProgress = {
  lessonViewed: string[]
  lessonCompleted: string[]
  attempts: Array<{ topicId: string; questionId: string; correct: boolean; answeredAt: string }>
}

const emptyProgress = (): GrammarLessonProgress => ({
  lessonViewed: [],
  lessonCompleted: [],
  attempts: [],
})

export function getGrammarLessonProgress(): GrammarLessonProgress {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<GrammarLessonProgress> | null
    if (!parsed) return emptyProgress()

    return {
      lessonViewed: Array.isArray(parsed.lessonViewed) ? parsed.lessonViewed : [],
      lessonCompleted: Array.isArray(parsed.lessonCompleted) ? parsed.lessonCompleted : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    }
  } catch {
    return emptyProgress()
  }
}

export function saveGrammarAttempt(topicId: string, questionId: string, correct: boolean) {
  const progress = getGrammarLessonProgress()
  const next = { ...progress, attempts: [...progress.attempts, { topicId, questionId, correct, answeredAt: new Date().toISOString() }] }
  saveGrammarLessonProgress(next)
  return next
}

function saveGrammarLessonProgress(progress: GrammarLessonProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function markGrammarLessonViewed(topicId: string) {
  const progress = getGrammarLessonProgress()
  if (progress.lessonViewed.includes(topicId)) return progress

  const next = { ...progress, lessonViewed: [...progress.lessonViewed, topicId] }
  saveGrammarLessonProgress(next)
  return next
}

/** Call only after a future practice flow verifies that the learner finished it. */
export function markGrammarLessonCompleted(topicId: string) {
  const progress = getGrammarLessonProgress()
  if (progress.lessonCompleted.includes(topicId)) return progress

  const next = { ...progress, lessonCompleted: [...progress.lessonCompleted, topicId] }
  saveGrammarLessonProgress(next)
  return next
}
