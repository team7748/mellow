import { afterEach, describe, expect, it, vi } from "vitest"
import { checkSpeakAnswer } from "./speakAnswerService"

const request = {
  questionEnglish: "What time do you usually wake up?",
  questionThai: "คุณตื่นกี่โมง",
  answerExample: "I usually wake up at 7 AM.",
  usefulPhrases: "I usually...|At...",
  userAnswer: "I normally get up around seven.",
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("checkSpeakAnswer", () => {
  it("posts complete question context and returns a typed evaluation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "correct",
      isMeaningCorrect: true,
      isGrammarCorrect: true,
      isNatural: true,
      correctedAnswer: "",
      errorPart: "",
      explanationThai: "ถูกต้อง! คำตอบของคุณสื่อความหมายได้ดีและใช้ไวยากรณ์ถูกต้อง",
      hintThai: "",
      acceptedExamples: ["I normally get up around seven."],
    }), { status: 200 })))

    await expect(checkSpeakAnswer(request)).resolves.toMatchObject({ status: "correct" })
    expect(fetch).toHaveBeenCalledWith("/api/speak-answer-check", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }))
  })

  it("rejects an answer longer than 500 characters before calling the API", async () => {
    vi.stubGlobal("fetch", vi.fn())

    await expect(checkSpeakAnswer({ ...request, userAnswer: "a".repeat(501) })).rejects.toMatchObject({
      code: "answer_too_long",
    })
    expect(fetch).not.toHaveBeenCalled()
  })
})
