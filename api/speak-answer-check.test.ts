import { describe, expect, it, vi } from "vitest"
import { createSpeakAnswerCheckHandler } from "./speak-answer-check"

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  }
  response.status.mockReturnValue(response)
  return response
}

const validBody = {
  questionEnglish: "What time do you usually wake up?",
  questionThai: "คุณตื่นกี่โมง",
  userAnswer: "I get up at seven.",
}

describe("speak answer check endpoint", () => {
  it("rejects non-POST requests", async () => {
    const response = createResponse()
    await createSpeakAnswerCheckHandler(vi.fn())({ method: "GET" }, response)
    expect(response.status).toHaveBeenCalledWith(405)
    expect(response.json).toHaveBeenCalledWith({ error: "method_not_allowed" })
  })

  it("rejects empty and overlong answers without calling the evaluator", async () => {
    const evaluate = vi.fn()
    const response = createResponse()
    await createSpeakAnswerCheckHandler(evaluate)({ method: "POST", body: { ...validBody, userAnswer: "a".repeat(501) } }, response)
    expect(response.status).toHaveBeenCalledWith(400)
    expect(evaluate).not.toHaveBeenCalled()
  })

  it("turns evaluator failure into a safe unavailable response", async () => {
    const response = createResponse()
    await createSpeakAnswerCheckHandler(vi.fn().mockRejectedValue(new Error("quota")))({ method: "POST", body: validBody }, response)
    expect(response.status).toHaveBeenCalledWith(503)
    expect(response.json).toHaveBeenCalledWith({ error: "unavailable" })
  })
})
