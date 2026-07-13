import { GoogleGenAI, Type } from "@google/genai"
import type {
  SpeakAnswerCheckRequest,
  SpeakAnswerEvaluation,
  SpeakAnswerStatus,
} from "../../src/types/speakAnswerEvaluation"

const statuses: SpeakAnswerStatus[] = [
  "correct",
  "grammar_error",
  "meaning_error",
  "unnatural",
]

export const evaluationResponseSchema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, enum: statuses },
    isMeaningCorrect: { type: Type.BOOLEAN },
    isGrammarCorrect: { type: Type.BOOLEAN },
    isNatural: { type: Type.BOOLEAN },
    correctedAnswer: { type: Type.STRING },
    errorPart: { type: Type.STRING },
    explanationThai: { type: Type.STRING },
    hintThai: { type: Type.STRING },
    acceptedExamples: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "status",
    "isMeaningCorrect",
    "isGrammarCorrect",
    "isNatural",
    "correctedAnswer",
    "errorPart",
    "explanationThai",
    "hintThai",
    "acceptedExamples",
  ],
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

export function normalizeEvaluation(value: unknown): SpeakAnswerEvaluation {
  if (!value || typeof value !== "object") throw new Error("invalid_model_response")
  const candidate = value as Record<string, unknown>

  if (
    !isString(candidate.status) ||
    !statuses.includes(candidate.status as SpeakAnswerStatus) ||
    typeof candidate.isMeaningCorrect !== "boolean" ||
    typeof candidate.isGrammarCorrect !== "boolean" ||
    typeof candidate.isNatural !== "boolean"
  ) {
    throw new Error("invalid_model_response")
  }

  const correctedAnswer = isString(candidate.correctedAnswer) ? candidate.correctedAnswer.trim() : ""
  const errorPart = isString(candidate.errorPart) ? candidate.errorPart.trim() : ""
  const explanationThai = isString(candidate.explanationThai) ? candidate.explanationThai.trim() : ""
  const hintThai = isString(candidate.hintThai) ? candidate.hintThai.trim() : ""
  const acceptedExamples = Array.isArray(candidate.acceptedExamples)
    ? candidate.acceptedExamples.filter(isString).map(e => e.trim()).filter(Boolean).slice(0, 2)
    : []

  return {
    status: candidate.status as SpeakAnswerStatus,
    isMeaningCorrect: candidate.isMeaningCorrect,
    isGrammarCorrect: candidate.isGrammarCorrect,
    isNatural: candidate.isNatural,
    correctedAnswer,
    errorPart,
    explanationThai,
    hintThai,
    acceptedExamples,
  }
}

function buildPrompt(input: SpeakAnswerCheckRequest) {
  return `You are an English speaking-practice evaluator for Thai learners from beginner to intermediate level.

Evaluate the learner answer in the exact question context. Do not mark an answer wrong simply because it differs from the example answer.

Question (English): ${input.questionEnglish}
Question context (Thai): ${input.questionThai}
Example answer: ${input.answerExample || "No example supplied"}
Useful phrases: ${input.usefulPhrases || "No phrases supplied"}
Learner answer: ${input.userAnswer}

Return only JSON using the requested schema. Apply these rules:
- correct: meaning is correct, grammar is correct, and phrasing is natural or acceptable. Ignore capitalization and missing final punctuation. Accept contractions and equivalent valid answers. If the error is purely a minor spelling mistake or typo, DO NOT mark it as grammar_error; mark it as correct, but you may provide the correct spelling in explanationThai.
- grammar_error: meaning is sufficiently correct, but there is a real grammar error (tense, subject-verb agreement, article, preposition, pronoun, word order, or word form). Provide correctedAnswer, errorPart, and a concise Thai explanation.
- meaning_error: answer is off-topic, answers a different question, or lacks information required to answer. Provide concise Thai reason, a short Thai hint, and one or two valid examples.
- unnatural: grammar and meaning are acceptable but wording is not natural for a native speaker. Provide a more natural correctedAnswer and concise Thai explanation. Do not treat this as fully wrong.
- If the learner answer is already correct, use exactly this Thai explanation: "ถูกต้อง! คำตอบของคุณสื่อความหมายได้ดีและใช้ไวยากรณ์ถูกต้อง".
- Never use the example-answer text as the only correctness test. Keep all Thai explanations short and easy to understand.`
}

export async function evaluateSpeakAnswer(
  input: SpeakAnswerCheckRequest,
): Promise<SpeakAnswerEvaluation> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("missing_api_key")

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    contents: buildPrompt(input),
    config: {
      responseMimeType: "application/json",
      responseSchema: evaluationResponseSchema,
      temperature: 0.1,
    },
  })

  return normalizeEvaluation(JSON.parse(response.text || ""))
}
