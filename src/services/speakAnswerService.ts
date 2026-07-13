import {
  SpeakAnswerCheckError,
  type SpeakAnswerCheckRequest,
  type SpeakAnswerEvaluation,
} from "../types/speakAnswerEvaluation"

export async function checkSpeakAnswer(
  request: SpeakAnswerCheckRequest,
): Promise<SpeakAnswerEvaluation> {
  if (request.userAnswer.trim().length > 500) {
    throw new SpeakAnswerCheckError(
      "answer_too_long",
      "กรุณาพิมพ์คำตอบไม่เกิน 500 ตัวอักษร",
    )
  }

  const response = await fetch("/api/speak-answer-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new SpeakAnswerCheckError(
      "unavailable",
      "ยังตรวจคำตอบไม่ได้ กรุณาลองใหม่อีกครั้ง",
    )
  }

  return response.json() as Promise<SpeakAnswerEvaluation>
}
