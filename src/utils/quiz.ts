import type { QuizResult, VocabularyItem } from "../types/vocabulary"

export const QUIZ_RESULTS_STORAGE_KEY = "thai-english-vocab-quiz-results"

export type QuizQuestionType =
  | "english-to-thai"
  | "thai-to-english"
  | "sentence-to-word"

export type QuizQuestion = {
  id: string
  type: QuizQuestionType
  wordId: string
  prompt: string
  correctAnswer: string
  options: string[]
}

type CreateQuizQuestionOptions = {
  random?: () => number
  preferredTypes?: QuizQuestionType[]
}

const defaultTypes: QuizQuestionType[] = [
  "english-to-thai",
  "thai-to-english",
  "sentence-to-word",
]

function hasText(value?: string | null) {
  return Boolean(value && value.trim().length > 0)
}

function pickIndex(length: number, random: () => number) {
  return Math.min(Math.floor(random() * length), length - 1)
}

function shuffled<T>(items: T[], random: () => number) {
  return [...items].sort(() => random() - 0.5)
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(hasText)))
}

function getAnswerForType(word: VocabularyItem, type: QuizQuestionType) {
  return type === "english-to-thai" ? word.thaiMeaning : word.word
}

function getPromptForType(word: VocabularyItem, type: QuizQuestionType) {
  if (type === "english-to-thai") return word.word
  if (type === "thai-to-english") return word.thaiMeaning

  return word.example
}

function isTypeEligible(word: VocabularyItem, type: QuizQuestionType) {
  return type !== "sentence-to-word" || hasText(word.example)
}

function buildQuestion(
  word: VocabularyItem,
  words: VocabularyItem[],
  type: QuizQuestionType,
  random: () => number,
): QuizQuestion | null {
  if (!isTypeEligible(word, type)) return null

  const correctAnswer = getAnswerForType(word, type)
  const distractors = uniqueValues(
    words
      .filter((candidate) => candidate.id !== word.id)
      .map((candidate) => getAnswerForType(candidate, type)),
  ).filter((answer) => answer !== correctAnswer)

  if (!hasText(correctAnswer) || distractors.length < 3) {
    return null
  }

  const options = shuffled(
    [correctAnswer, ...shuffled(distractors, random).slice(0, 3)],
    random,
  )

  return {
    id: `${word.id}-${type}`,
    type,
    wordId: word.id,
    prompt: getPromptForType(word, type),
    correctAnswer,
    options,
  }
}

export function canCreateQuiz(words: VocabularyItem[]) {
  return words.length >= 4
}

export function createQuizQuestion(
  words: VocabularyItem[],
  options: CreateQuizQuestionOptions = {},
): QuizQuestion | null {
  if (!canCreateQuiz(words)) return null

  const random = options.random ?? Math.random
  const selectedWord = words[pickIndex(words.length, random)]
  const candidateTypes = options.preferredTypes ?? defaultTypes

  for (const type of candidateTypes) {
    const question = buildQuestion(selectedWord, words, type, random)

    if (question) {
      return question
    }
  }

  return null
}

export function loadQuizResults(): QuizResult[] {
  const rawValue = localStorage.getItem(QUIZ_RESULTS_STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? (parsed as QuizResult[]) : []
  } catch {
    return []
  }
}

export function saveQuizResult(result: QuizResult) {
  localStorage.setItem(
    QUIZ_RESULTS_STORAGE_KEY,
    JSON.stringify([...loadQuizResults(), result]),
  )
}

export function clearQuizResults() {
  localStorage.removeItem(QUIZ_RESULTS_STORAGE_KEY)
}
