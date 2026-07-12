/** Contracts for the unversioned grammar JSON files at the repository root. */
export const grammarStages = [
  "foundation",
  "beginner",
  "elementary",
  "intermediate",
] as const

export const grammarQuestionTypes = [
  "multiple_choice",
  "correct_or_incorrect",
  "choose_correct_sentence",
  "fill_blank",
  "sentence_builder",
  "correct_sentence",
  "find_mistake",
  "thai_to_english",
  "open_answer",
] as const

export type GrammarStage = (typeof grammarStages)[number]
export type GrammarQuestionType = (typeof grammarQuestionTypes)[number]
export type GrammarCategoryId = "present" | "past" | "future"
export type GrammarDifficulty = 1 | 2 | 3 | 4 | 5

export type GrammarUse = {
  id: string
  title: string
  descriptionThai: string
  example: string
  translation: string
}

export type GrammarStructure = {
  id: string
  type: string
  subjectGroup: string
  formula: string
  example: string
  translation: string
  noteThai: string
}

export type GrammarRule = {
  id: string
  title: string
  ruleThai: string
  examples: string[]
}

export type GrammarExample = {
  id: string
  sentence: string
  translation: string
  focus: string
  usage: string
}

export type GrammarCommonMistake = {
  id: string
  incorrect: string
  correct: string
  explanationThai: string
}

export type GrammarComparison = {
  id: string
  title: string
  keyDifferenceThai: string
  otherTense?: string
  otherForm?: string
  presentSimple?: string
  presentContinuous?: string
  presentPerfect?: string
  presentPerfectContinuous?: string
  pastSimple?: string
  pastContinuous?: string
  pastPerfect?: string
  pastPerfectContinuous?: string
  futureSimple?: string
  futureContinuous?: string
  futurePerfect?: string
  futurePerfectContinuous?: string
  will?: string
}

export type GrammarFlashcard = {
  id: string
  front: string
  back: string
  example: string
}

type GrammarPracticeQuestionBase = {
  id: string
  instructionThai: string
  answer: string
  explanationThai: string
}

export type GrammarMultipleChoiceQuestion = GrammarPracticeQuestionBase & {
  type: "multiple_choice"
  question: string
  options: string[]
  acceptedAnswers?: never
}

export type GrammarWrittenPracticeQuestion = GrammarPracticeQuestionBase & {
  type: Exclude<GrammarQuestionType, "multiple_choice">
  question: string | string[]
  acceptedAnswers: string[]
  options?: never
}

export type GrammarPracticeQuestion =
  | GrammarMultipleChoiceQuestion
  | GrammarWrittenPracticeQuestion

type GrammarMarker = {
  id: string
  word: string
  meaningThai: string
  usageThai: string
  example: string
}

type GrammarStativeVerbGroup = {
  group: string
  verbs: string[]
  example?: string
  correctExample?: string
  incorrectExample: string
}

type GrammarStativeVerbs = {
  descriptionThai: string
  commonVerbs: GrammarStativeVerbGroup[]
  importantNote: string
}

type GrammarForAndSince = {
  descriptionThai: string
  for: { meaningThai: string; useThai: string; examples: string[]; sentence: string }
  since: { meaningThai: string; useThai: string; examples: string[]; sentence: string }
  keyDifferenceThai: string
}

/** The shared source fields plus every audited optional lesson section. */
export type GrammarTopic = {
  id: string
  categoryId: GrammarCategoryId
  name: string
  nameThai: string
  slug: string
  stage: GrammarStage
  difficulty: GrammarDifficulty
  displayOrder: number
  estimatedMinutes: number
  prerequisites: string[]
  summary: { en: string; th: string }
  learningObjectives: string[]
  uses: GrammarUse[]
  structures: GrammarStructure[]
  timeMarkers: Array<{ text: string; meaningThai: string; example: string }>
  examples: GrammarExample[]
  commonMistakes: GrammarCommonMistake[]
  comparisons: GrammarComparison[]
  flashcards: GrammarFlashcard[]
  practice: GrammarPracticeQuestion[]
  verbRules?: GrammarRule[]
  verbIngRules?: GrammarRule[]
  regularVerbRules?: GrammarRule[]
  pastParticipleRules?: GrammarRule[]
  irregularVerbs?: Array<{ base: string; past: string; example: string }>
  irregularPastParticiples?: Array<{
    base: string
    pastSimple: string
    pastParticiple: string
    example: string
  }>
  keywordUsage?: Array<{
    id: string
    word: string
    meaningThai: string
    positionThai: string
    example: string
  }>
  sequenceMarkers?: GrammarMarker[]
  connectors?: GrammarMarker[]
  deadlineMarkers?: GrammarMarker[]
  stativeVerbs?: GrammarStativeVerbs
  forAndSince?: GrammarForAndSince
  adverbsOfFrequency?: {
    descriptionThai: string
    beforeMainVerb: { formula: string; examples: string[] }
    afterVerbToBe: { formula: string; examples: string[] }
    sometimesNote: string
    scale: Array<{ word: string; meaningThai: string; approximateFrequency: string }>
  }
  wasWere?: {
    descriptionThai: string
    was: { subjects: string[]; example: string }
    were: { subjects: string[]; example: string }
    negativeExamples: string[]
    questionExamples: string[]
    importantNote: string
  }
  whenAndWhile?: {
    descriptionThai: string
    when: { usageThai: string; examples: string[] }
    while: { usageThai: string; examples: string[] }
    importantNote: string
  }
  sequenceGuide?: {
    descriptionThai: string
    steps: string[]
    example: { earlierAction: string; laterAction: string; combined: string }
  }
  howLong?: {
    descriptionThai: string
    formula: string
    examples: Array<{ question: string; answer: string }>
  }
  futureFormsOverview?: {
    title: string
    descriptionThai: string
    forms: Array<{ form: string; useThai: string; example: string }>
    keyReminderThai: string
  }
  politeQuestions?: {
    title: string
    descriptionThai: string
    examples: Array<{
      futureContinuous?: string
      futureSimple?: string
      meaningThai: string
      toneThai: string
    }>
  }
  futureTimeReference?: {
    descriptionThai: string
    commonPatterns: Array<{ pattern: string; example: string }>
    importantNote: string
  }
  futureTimeClauses?: {
    title: string
    descriptionThai: string
    correctExamples: string[]
    incorrectExamples: string[]
    keyReminderThai: string
  }
  targetTimeGuide?: {
    title: string
    descriptionThai: string
    clearExamples: string[]
    unclearExample: string
    noteThai: string
  }
  durationAndDeadline?: {
    descriptionThai: string
    for: { meaningThai: string; useThai: string; examples: string[]; sentence: string }
    by: { meaningThai: string; useThai: string; examples: string[]; sentence: string }
    byTheTime: {
      meaningThai: string
      useThai: string
      sentence: string
      importantNote: string
    }
  }
  naturalUsageGuide?: {
    title: string
    descriptionThai: string
    useWhen: string[]
    avoidWhen: Array<{
      situationThai: string
      lessNatural: string
      moreNatural: string
    }>
  }
}

export type GrammarTopicSummary = Pick<
  GrammarTopic,
  | "id"
  | "categoryId"
  | "name"
  | "nameThai"
  | "slug"
  | "stage"
  | "difficulty"
  | "displayOrder"
  | "estimatedMinutes"
  | "prerequisites"
>

export type GrammarValidationIssue = {
  code: string
  topicId: string
  path: string
  message: string
}

export type GrammarLoadError =
  | "topic_not_found"
  | "load_failed"
  | "validation_failed"

export type GrammarLoadResult =
  | { ok: true; topic: GrammarTopic }
  | { ok: false; error: GrammarLoadError }
