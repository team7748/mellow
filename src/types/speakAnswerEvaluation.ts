export type SpeakAnswerStatus = "correct" | "grammar_error" | "meaning_error" | "unnatural"

export type SpeakAnswerCheckRequest = {
  questionEnglish: string
  questionThai: string
  answerExample?: string
  usefulPhrases?: string
  userAnswer: string
}

export type SpeakAnswerEvaluation = {
  status: SpeakAnswerStatus
  isMeaningCorrect: boolean
  isGrammarCorrect: boolean
  isNatural: boolean
  correctedAnswer: string
  errorPart: string
  explanationThai: string
  hintThai: string
  acceptedExamples: string[]
}

export class SpeakAnswerCheckError extends Error {
  constructor(
    public code: "answer_too_long" | "unavailable",
    message: string,
  ) {
    super(message)
  }
}
