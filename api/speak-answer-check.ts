import type {
  SpeakAnswerCheckRequest,
  SpeakAnswerEvaluation,
} from "../src/types/speakAnswerEvaluation"
import { evaluateSpeakAnswer } from "./lib/speakAnswerEvaluator"

type RequestLike = {
  method?: string
  body?: unknown
}

type ResponseLike = {
  status: (statusCode: number) => ResponseLike
  json: (body: unknown) => unknown
}

type Evaluator = (input: SpeakAnswerCheckRequest) => Promise<SpeakAnswerEvaluation>

function isValidRequest(body: unknown): body is SpeakAnswerCheckRequest {
  if (!body || typeof body !== "object") return false
  const candidate = body as Record<string, unknown>

  return (
    typeof candidate.questionEnglish === "string" &&
    candidate.questionEnglish.trim().length > 0 &&
    typeof candidate.questionThai === "string" &&
    typeof candidate.userAnswer === "string" &&
    candidate.userAnswer.trim().length > 0 &&
    candidate.userAnswer.trim().length <= 500 &&
    (candidate.answerExample === undefined || typeof candidate.answerExample === "string") &&
    (candidate.usefulPhrases === undefined || typeof candidate.usefulPhrases === "string")
  )
}

export function createSpeakAnswerCheckHandler(evaluate: Evaluator) {
  return async function handler(req: RequestLike, res: ResponseLike) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "method_not_allowed" })
    }

    if (!isValidRequest(req.body)) {
      return res.status(400).json({ error: "invalid_request" })
    }

    try {
      const sanitizedBody: SpeakAnswerCheckRequest = {
        ...(req.body as SpeakAnswerCheckRequest),
        questionEnglish: (req.body as any).questionEnglish.trim(),
        questionThai: (req.body as any).questionThai.trim(),
        userAnswer: (req.body as any).userAnswer.trim(),
        answerExample: (req.body as any).answerExample?.trim(),
        usefulPhrases: (req.body as any).usefulPhrases?.trim(),
      }
      return res.status(200).json(await evaluate(sanitizedBody))
    } catch (error) {
      console.error("Speak Answer Check Error:", error)
      return res.status(503).json({ error: "unavailable" })
    }
  }
}

export default createSpeakAnswerCheckHandler(evaluateSpeakAnswer)
