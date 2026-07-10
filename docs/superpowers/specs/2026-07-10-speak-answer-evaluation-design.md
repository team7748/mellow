# Speak Mode Semantic Answer Evaluation Design

## Goal

Replace Speak Mode's length-only typed-answer check with a server-side AI evaluation that judges the answer in its question context. It must accept varied valid English answers, identify grammar errors separately from meaning errors, and give short Thai feedback for beginner-to-intermediate learners.

## Chosen approach

Use the Gemini Developer API Free Tier from a server-only endpoint. The browser never receives the API key. The endpoint sends the practice question, Thai context, example answer, useful phrases, and the learner's answer to Gemini and requires a constrained JSON response.

This approach is chosen over client-side rules because semantic equivalence, grammar assessment, and naturalness cannot be reliably inferred by matching against one example answer.

## Architecture

### Client

`InteractivePracticePlayer` owns the answer draft and a new answer-check state: `idle`, `checking`, `result`, or `error`.

On Check Answer, the client first validates an empty answer locally. It then disables the textarea and check button, renders the Thai "กำลังตรวจคำตอบ" status, and POSTs context to `/api/speak-answer-check`. A request identifier and checking guard prevent duplicate concurrent submissions.

When the response arrives, the player renders a dedicated feedback panel. "Try again" returns focus to the textarea while preserving the draft. "Show example" continues to use the existing example-answer section. The existing speech button uses the corrected answer when available and otherwise the example answer. Question listening, speech speed, navigation, and progress flow stay unchanged.

### Server endpoint

The endpoint accepts only a bounded JSON payload:

```ts
type SpeakAnswerCheckRequest = {
  questionEnglish: string
  questionThai: string
  answerExample?: string
  usefulPhrases?: string
  userAnswer: string
}
```

It rejects malformed input, empty answers, and answers over 500 characters. It uses `GEMINI_API_KEY` from the server environment and calls a Free Tier-compatible Gemini Flash/Lite model. No `VITE_` prefix is used for this key.

The model prompt explicitly says:

- evaluate in the context of the question, never by exact textual similarity to the example;
- ignore capitalization and terminal punctuation as correctness issues;
- accept contractions and equivalent answers;
- choose `grammar_error` when meaning is adequate but real grammar is wrong;
- choose `meaning_error` when the answer is off-topic or lacks required information;
- choose `unnatural` when meaning and grammar are acceptable but phrasing is not natural;
- provide concise Thai explanations and 1–2 accepted examples;
- return JSON only, matching the response schema.

The endpoint validates and normalizes the returned JSON before sending it to the client. If the model output is malformed or the API is unavailable, it returns a safe Thai error state rather than inventing a grade.

### Response contract

```ts
type SpeakAnswerEvaluation = {
  status: "correct" | "grammar_error" | "meaning_error" | "unnatural"
  isMeaningCorrect: boolean
  isGrammarCorrect: boolean
  isNatural: boolean
  correctedAnswer: string
  errorPart: string
  explanationThai: string
  hintThai: string
  acceptedExamples: string[]
}
```

`correctedAnswer`, `errorPart`, `hintThai`, and `acceptedExamples` may be empty when they do not apply. The endpoint always enforces valid booleans, one of the four statuses, non-empty Thai learner feedback, and at most two examples.

## UI behavior

The feedback panel has a full tinted surface rather than a decorative side stripe:

- Correct: green, check icon, exact Thai success copy.
- Grammar Error: orange/red, error icon, original answer with `errorPart` highlighted, corrected sentence, and short Thai explanation.
- Meaning Error: red, alert icon, reason, short hint, and one or two accepted examples.
- Understandable but Unnatural: amber, lightbulb icon, more natural alternative, and short Thai explanation.

Small punctuation and capitalization issues are included as a non-blocking suggestion only. Buttons remain touch-friendly and stack on narrow screens.

## Free Tier and safety controls

- Use a low-cost/Free Tier Gemini Flash/Lite model configured only on the server.
- Enforce a 500-character answer maximum and short context fields.
- Reject a second check while one is in flight.
- Add a small per-browser cooldown after a completed request to stop accidental repeated clicks.
- Return a clear Thai unavailable message when the Free Tier quota or API is unavailable.
- Do not record API keys, raw prompts, or learner answers in persistent progress.

## Testing

Unit tests cover client rendering and API-result normalization for:

1. exact correct answer;
2. semantically equivalent correct answer;
3. wrong tense;
4. subject–verb agreement;
5. article error;
6. preposition error;
7. understandable but unnatural phrasing;
8. off-topic answer;
9. empty answer;
10. answer that is too short but valid for a yes/no question;
11. lowercase correct answer;
12. missing terminal punctuation;
13. contractions;
14. rapid repeated clicks;
15. narrow mobile layout behavior.

Endpoint tests mock the Gemini transport only at the network boundary and validate request rejection, JSON normalization, status mapping, malformed model output, and unavailable API behavior.

## Compatibility constraints

No changes are made to the existing conversation CSV schema, speak-mode progress storage, authentication modes, audio playback, speech speed preference, conversation switching, or choice-based/legacy answer interactions.

## Known limitation

AI evaluation can occasionally make an incorrect judgment. The strict JSON contract, context-rich prompt, response validation, and example answers reduce this risk but cannot eliminate it. Free Tier quotas and models may change by provider policy; the interface must therefore handle quota/API failure without grading the answer.
