# Speak Answer Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Add a Vercel serverless Gemini Free Tier evaluator to Speak Mode that grades typed answers by contextual meaning, grammar, and naturalness.

**Architecture:** The browser posts bounded practice context to \`/api/speak-answer-check\`; the Vercel function keeps \`GEMINI_API_KEY\` secret and returns normalized evaluation JSON. A client service isolates API state from the existing player, preserving current speech, navigation, and progress behavior.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Vercel Serverless Functions, \`@google/genai\`.

## Global Constraints

- Keep \`GEMINI_API_KEY\` server-only; never use a \`VITE_\` prefix.
- Use the configurable Free Tier model \`GEMINI_MODEL\`, defaulting to \`gemini-2.5-flash-lite\`.
- Do not change CSV data, progress storage, audio, speech speed, conversation navigation, Guest/Auth, or other question modes.
- Ignore capitalization and final punctuation; accept contractions and semantically equivalent answers.
- Reject answers over 500 characters and prevent concurrent checks.
- Thai feedback is short, beginner-friendly, accessible, and responsive.

---

## File Structure

- \`src/types/speakAnswerEvaluation.ts\`: request/result contracts.
- \`src/services/speakAnswerService.ts\`: typed fetch client and client-side length guard.
- \`src/services/speakAnswerService.test.ts\`: protocol and unavailable-service tests.
- \`api/lib/speakAnswerEvaluator.ts\`: Gemini structured prompt and normalized result parser.
- \`api/lib/speakAnswerEvaluator.test.ts\`: schema/normalization tests.
- \`api/speak-answer-check.ts\`: Vercel POST handler.
- \`api/speak-answer-check.test.ts\`: request and provider-failure tests.
- \`src/components/speak/InteractivePracticePlayer.tsx\`: checking state and feedback UI.
- \`src/components/speak/InteractivePracticePlayer.test.tsx\`: player regressions.
- \`package.json\`, \`.env.example\`, \`docs/DEPLOYMENT.md\`: runtime and deployment configuration.

### Task 1: Define client contract and API service

**Files:**
- Create: \`src/types/speakAnswerEvaluation.ts\`
- Create: \`src/services/speakAnswerService.ts\`
- Test: \`src/services/speakAnswerService.test.ts\`

**Interfaces:**
- Produces \`SpeakAnswerCheckRequest\`, \`SpeakAnswerEvaluation\`, \`SpeakAnswerCheckError\`, and \`checkSpeakAnswer(request)\`.
- Consumes only browser \`fetch\`; it has no secret/model access.

- [ ] **Step 1: Write the failing tests**

\`\`\`ts
it("posts question context and returns a typed evaluation", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    status: "correct", isMeaningCorrect: true, isGrammarCorrect: true, isNatural: true,
    correctedAnswer: "", errorPart: "", explanationThai: "ถูกต้อง! คำตอบของคุณสื่อความหมายได้ดีและใช้ไวยากรณ์ถูกต้อง",
    hintThai: "", acceptedExamples: ["I normally get up around seven."],
  }), { status: 200 })))
  await expect(checkSpeakAnswer(request)).resolves.toMatchObject({ status: "correct" })
  expect(fetch).toHaveBeenCalledWith("/api/speak-answer-check", expect.objectContaining({ method: "POST" }))
})

it("rejects more than 500 answer characters before calling the API", async () => {
  vi.stubGlobal("fetch", vi.fn())
  await expect(checkSpeakAnswer({ ...request, userAnswer: "a".repeat(501) })).rejects.toMatchObject({ code: "answer_too_long" })
  expect(fetch).not.toHaveBeenCalled()
})
\`\`\`

- [ ] **Step 2: Run test to verify it fails**

Run: \`npm test -- src/services/speakAnswerService.test.ts\`

Expected: FAIL because \`speakAnswerService\` does not yet exist.

- [ ] **Step 3: Write minimal implementation**

\`\`\`ts
export type SpeakAnswerStatus = "correct" | "grammar_error" | "meaning_error" | "unnatural"
export type SpeakAnswerCheckRequest = { questionEnglish: string; questionThai: string; answerExample?: string; usefulPhrases?: string; userAnswer: string }
export type SpeakAnswerEvaluation = { status: SpeakAnswerStatus; isMeaningCorrect: boolean; isGrammarCorrect: boolean; isNatural: boolean; correctedAnswer: string; errorPart: string; explanationThai: string; hintThai: string; acceptedExamples: string[] }
export class SpeakAnswerCheckError extends Error {
  constructor(public code: "answer_too_long" | "unavailable", message: string) { super(message) }
}

export async function checkSpeakAnswer(request: SpeakAnswerCheckRequest): Promise<SpeakAnswerEvaluation> {
  if (request.userAnswer.trim().length > 500) throw new SpeakAnswerCheckError("answer_too_long", "กรุณาพิมพ์คำตอบไม่เกิน 500 ตัวอักษร")
  const response = await fetch("/api/speak-answer-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) })
  if (!response.ok) throw new SpeakAnswerCheckError("unavailable", "ยังตรวจคำตอบไม่ได้ กรุณาลองใหม่อีกครั้ง")
  return response.json() as Promise<SpeakAnswerEvaluation>
}
\`\`\`

- [ ] **Step 4: Run tests to verify they pass**

Run: \`npm test -- src/services/speakAnswerService.test.ts\`

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

\`\`\`bash
git add src/types/speakAnswerEvaluation.ts src/services/speakAnswerService.ts src/services/speakAnswerService.test.ts
git commit -m "feat: add Speak Mode answer check client"
\`\`\`

### Task 2: Add server-only Gemini structured evaluator

**Files:**
- Create: \`api/lib/speakAnswerEvaluator.ts\`
- Create: \`api/lib/speakAnswerEvaluator.test.ts\`
- Create: \`api/speak-answer-check.ts\`
- Create: \`api/speak-answer-check.test.ts\`
- Modify: \`package.json\`
- Modify: \`.env.example\`

**Interfaces:**
- Consumes validated \`SpeakAnswerCheckRequest\` and server-only \`GEMINI_API_KEY\`/optional \`GEMINI_MODEL\`.
- Produces \`POST /api/speak-answer-check -> SpeakAnswerEvaluation\`.

- [ ] **Step 1: Write failing normalizer tests**

\`\`\`ts
it("preserves grammar errors and limits examples to two", () => {
  expect(normalizeEvaluation({
    status: "grammar_error", isMeaningCorrect: true, isGrammarCorrect: false, isNatural: true,
    correctedAnswer: "She goes to work every day.", errorPart: "go", explanationThai: "ประธาน She ต้องใช้ goes",
    hintThai: "ดูกริยา", acceptedExamples: ["A", "B", "C"],
  })).toMatchObject({ status: "grammar_error", acceptedExamples: ["A", "B"] })
})

it("rejects malformed model output", () => {
  expect(() => normalizeEvaluation({ status: "maybe" })).toThrow("invalid_model_response")
})
\`\`\`

- [ ] **Step 2: Run tests to verify they fail**

Run: \`npm test -- api/lib/speakAnswerEvaluator.test.ts api/speak-answer-check.test.ts\`

Expected: FAIL because the evaluator and endpoint do not exist.

- [ ] **Step 3: Write minimal server implementation**

\`\`\`ts
import { GoogleGenAI, Type } from "@google/genai"

export const responseSchema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, enum: ["correct", "grammar_error", "meaning_error", "unnatural"] },
    isMeaningCorrect: { type: Type.BOOLEAN }, isGrammarCorrect: { type: Type.BOOLEAN }, isNatural: { type: Type.BOOLEAN },
    correctedAnswer: { type: Type.STRING }, errorPart: { type: Type.STRING }, explanationThai: { type: Type.STRING },
    hintThai: { type: Type.STRING }, acceptedExamples: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["status", "isMeaningCorrect", "isGrammarCorrect", "isNatural", "correctedAnswer", "errorPart", "explanationThai", "hintThai", "acceptedExamples"],
}

export async function evaluateSpeakAnswer(input: SpeakAnswerCheckRequest) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    contents: buildPrompt(input),
    config: { responseMimeType: "application/json", responseSchema, temperature: 0.1 },
  })
  return normalizeEvaluation(JSON.parse(response.text || ""))
}
\`\`\`

Implement \`buildPrompt\` to enforce contextual (not exact-match) assessment, the four classifications, capitalization/punctuation/contraction tolerance, and concise Thai output. Implement \`normalizeEvaluation\` to validate every required field, cap examples at two, and throw \`invalid_model_response\`; do not guess a grade. The Vercel handler returns 405 for non-POST, 400 for missing/invalid/over-500 input, 503 for missing key, quota, malformed output, or provider failure. Do not log user content.

Move \`@google/genai\` from \`devDependencies\` to \`dependencies\`; add \`@vercel/node\` under \`devDependencies\`. Add:

\`\`\`dotenv
# Server-only Vercel variable. Never use VITE_GEMINI_API_KEY.
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
# Free Tier model; change only when provider availability changes.
GEMINI_MODEL=gemini-2.5-flash-lite
\`\`\`

- [ ] **Step 4: Run server tests to verify they pass**

Run: \`npm test -- api/lib/speakAnswerEvaluator.test.ts api/speak-answer-check.test.ts\`

Expected: PASS; malformed/unavailable providers never produce a grade.

- [ ] **Step 5: Commit**

\`\`\`bash
git add api package.json package-lock.json .env.example
git commit -m "feat: add Gemini Speak Mode evaluation endpoint"
\`\`\`

### Task 3: Render checking and four feedback outcomes

**Files:**
- Modify: \`src/components/speak/InteractivePracticePlayer.tsx\`
- Create: \`src/components/speak/InteractivePracticePlayer.test.tsx\`

**Interfaces:**
- Consumes \`checkSpeakAnswer\` and \`SpeakAnswerEvaluation\` from Task 1.
- Produces accessible Correct, Grammar Error, Meaning Error, and Unnatural panels without changing navigation/audio APIs.

- [ ] **Step 1: Write failing UI tests**

\`\`\`tsx
it("locks the editor while checking and preserves draft for Try Again", async () => {
  vi.mocked(checkSpeakAnswer).mockImplementation(() => new Promise(() => {}))
  render(<InteractivePracticePlayer categoryTitle="Morning" questions={[question]} />)
  await userEvent.type(screen.getByLabelText("Your Answer"), "I wake up at seven")
  await userEvent.click(screen.getByRole("button", { name: "Check Answer" }))
  expect(screen.getByLabelText("Your Answer")).toBeDisabled()
  expect(screen.getByText("กำลังตรวจคำตอบ")).toBeInTheDocument()
})

it.each([
  ["correct", "ถูกต้อง! คำตอบของคุณสื่อความหมายได้ดีและใช้ไวยากรณ์ถูกต้อง"],
  ["grammar_error", "เกือบถูกแล้ว แต่ยังมีจุดที่ต้องแก้ด้านไวยากรณ์"],
  ["meaning_error", "คำตอบยังไม่ตรงกับคำถาม ลองอ่านสถานการณ์อีกครั้ง"],
  ["unnatural", "เข้าใจได้ แต่ยังไม่เป็นธรรมชาติ"],
])("renders Thai feedback for %s", async (status, text) => { /* mock typed result, then assert text */ })
\`\`\`

Add tests for exact answer, semantic equivalent, tense, subject-verb, article, preposition, unnatural wording, off-topic answer, empty answer, valid short yes/no answer, lowercase, no period, contractions, duplicate clicks, and 360px mobile control stacking.

- [ ] **Step 2: Run test to verify it fails**

Run: \`npm test -- src/components/speak/InteractivePracticePlayer.test.tsx\`

Expected: FAIL because the player has only length-based feedback.

- [ ] **Step 3: Implement state and feedback UI**

\`\`\`tsx
const [evaluation, setEvaluation] = useState<SpeakAnswerEvaluation | null>(null)
const [isChecking, setIsChecking] = useState(false)
const [checkError, setCheckError] = useState("")

const handleCheckAnswer = async () => {
  if (!answer.trim() || isChecking) return
  setIsChecking(true); setEvaluation(null); setCheckError("")
  try {
    const result = await checkSpeakAnswer({
      questionEnglish: currentQuestion.questionEnglish, questionThai: currentQuestion.questionThai,
      answerExample: currentQuestion.answerExample, usefulPhrases: currentQuestion.usefulPhrases, userAnswer: answer,
    })
    setEvaluation(result)
    result.status === "correct" ? playCorrectSound() : playIncorrectSound()
  } catch (error) {
    setCheckError(error instanceof Error ? error.message : "ยังตรวจคำตอบไม่ได้ กรุณาลองใหม่อีกครั้ง")
  } finally { setIsChecking(false) }
}
\`\`\`

Disable textarea, phrase buttons, and Check Answer while checking. Show \`กำลังตรวจคำตอบ\` with \`aria-live="polite"\`. Reset evaluation/error on question change. Try Again clears only evaluation/error and focuses the textarea, retaining the draft. Use full tinted green/orange/red/amber panels with Lucide icons; show submitted answer and \`<mark>\` only when \`errorPart\` exists, corrected sentence when supplied, examples/hint when supplied, and \`SpeakButton\` for \`correctedAnswer || answerExample\`. Keep the current example-answer and speed controls.

- [ ] **Step 4: Run UI tests to verify they pass**

Run: \`npm test -- src/components/speak/InteractivePracticePlayer.test.tsx\`

Expected: PASS for all learner states, draft retry, and duplicate prevention.

- [ ] **Step 5: Commit**

\`\`\`bash
git add src/components/speak/InteractivePracticePlayer.tsx src/components/speak/InteractivePracticePlayer.test.tsx
git commit -m "feat: show Speak Mode answer evaluation feedback"
\`\`\`

### Task 4: Deploy and verify

**Files:**
- Modify: \`docs/DEPLOYMENT.md\`

**Interfaces:**
- Consumes Vercel environment variables and build output.
- Produces deployment guidance that keeps credentials isolated.

- [ ] **Step 1: Add exact deployment instructions**

\`\`\`markdown
## Speak Mode AI checker

Deploy on Vercel so \`api/speak-answer-check.ts\` is available. In Vercel Project Settings → Environment Variables, set \`GEMINI_API_KEY\` and optionally \`GEMINI_MODEL=gemini-2.5-flash-lite\` for Production, Preview, and Development. Never add \`VITE_GEMINI_API_KEY\`.

For local endpoint testing, run \`npx vercel dev\`. Use \`npm run dev\` only for frontend work with a mocked endpoint.
\`\`\`

- [ ] **Step 2: Verify the documentation change**

Run: \`rg -n "GEMINI_API_KEY|Vercel|speak-answer-check" docs/DEPLOYMENT.md\`

Expected: new serverless deployment instructions appear.

- [ ] **Step 3: Run full automated verification**

Run: \`npm test\`

Expected: all test suites pass, including all required semantic/grammar/naturalness and input-state cases.

Run: \`npm run build\`

Expected: TypeScript and Vite finish with exit code 0.

- [ ] **Step 4: Verify server function and mobile UI manually**

Run: \`npx vercel dev\`

Expected: Vercel reports the Vite app and \`/api/speak-answer-check\` endpoint.

At 360px width, verify checking lock, each colored feedback type, correction audio, Try Again retaining text, Show Example, speed choices, question navigation, and current progress behavior.

- [ ] **Step 5: Commit docs**

\`\`\`bash
git add docs/DEPLOYMENT.md
git commit -m "docs: explain Speak Mode AI checker deployment"
\`\`\`

## Plan Self-Review

- Spec coverage: Tasks 1–2 implement secure contextual evaluation and Free Tier safeguards; Task 3 implements the four results, feedback controls, responsive UI, and compatibility; Task 4 covers deployment, test suite, build, and mobile checks.
- Placeholder scan: all endpoint paths, contracts, statuses, validation limits, errors, and commands are explicit.
- Type consistency: all layers use \`SpeakAnswerCheckRequest\`, \`SpeakAnswerEvaluation\`, and \`/api/speak-answer-check\`.

