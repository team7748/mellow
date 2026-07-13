import type { GrammarPracticeQuestion } from "../../types/grammar"

export function selectGrammarSession(questions: GrammarPracticeQuestion[], limit = 10) {
  return [...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(limit, questions.length))
}

export type GrammarEvaluationLevel = 
  | "correct_natural"
  | "correct_but_improvable"
  | "understandable_with_grammar_issue"
  | "incorrect"

export type GrammarErrorType =
  | "tense"
  | "verb_form"
  | "auxiliary"
  | "agreement"
  | "word_order"
  | "spelling"
  | "missing_word"
  | "unnecessary_word"
  | "time_marker"
  | "unnatural_expression"
  | "meaning_mismatch"

export type GrammarEvaluationResult = {
  correct: boolean
  level: GrammarEvaluationLevel
  errorTypes: GrammarErrorType[]
}

export function expandContractions(text: string): string {
  let expanded = text.replace(/n't\b/g, " not");
  expanded = expanded.replace(/\bwon not\b/g, "will not");
  expanded = expanded.replace(/\bcan not\b/g, "cannot");
  return expanded;
}

export function normalizeInput(value: string) {
  let val = value.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
  val = expandContractions(val);
  return val.replace(/\s+/g, " ").trim();
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

export function evaluateGrammarAnswer(question: GrammarPracticeQuestion, response: string): GrammarEvaluationResult {
  // 1. Empty Check
  if (!response.trim()) {
    return { correct: false, level: "incorrect", errorTypes: ["missing_word"] }
  }

  // 2. Normalize Input
  const normalizedResponse = normalizeInput(response)
  const acceptedAnswers = question.type === "multiple_choice" 
    ? [question.answer] 
    : (question as any).acceptedAnswers || [question.answer];
  
  const normalizedAccepted = acceptedAnswers.map(normalizeInput);

  // 3. Accepted Answers (Exact Match)
  if (normalizedAccepted.includes(normalizedResponse)) {
    return { correct: true, level: "correct_natural", errorTypes: [] }
  }

  // Find closest expected
  let closestExpected = normalizedAccepted[0];
  let minDiff = Infinity;
  for (const expected of normalizedAccepted) {
    const diff = levenshteinDistance(normalizedResponse, expected);
    if (diff < minDiff) {
      minDiff = diff;
      closestExpected = expected;
    }
  }

  const responseTokens = normalizedResponse.split(" ").filter((t: string) => !!t)
  const expectedTokens = closestExpected.split(" ").filter((t: string) => !!t)

  // 4. Meaning (Open Answer logic)
  if (question.type === "open_answer") {
    const expectedTokenSet = new Set(expectedTokens);
    const matchedTokens = responseTokens.filter((t: string) => expectedTokenSet.has(t));
    const coverage = matchedTokens.length / expectedTokens.length;
    
    if (coverage >= 0.6) {
       return { correct: true, level: "correct_but_improvable", errorTypes: ["unnatural_expression"] }
    } else {
       return { correct: false, level: "understandable_with_grammar_issue", errorTypes: ["meaning_mismatch"] }
    }
  }

  // Detect Errors
  const missing = expectedTokens.filter((token: string) => !responseTokens.includes(token))
  const extra = responseTokens.filter((token: string) => !expectedTokens.includes(token))
  const errors: GrammarErrorType[] = [];

  const hasSpellingError = missing.some((mToken: string) => 
    extra.some((eToken: string) => levenshteinDistance(mToken, eToken) <= 2 && mToken.length > 3)
  );
  if (hasSpellingError) errors.push("spelling");

  const auxiliaries = new Set(["am", "is", "are", "was", "were", "do", "does", "did", "have", "has", "had", "will", "would", "can", "could"]);
  const missingAux = missing.some((t: string) => auxiliaries.has(t));
  const extraAux = extra.some((t: string) => auxiliaries.has(t));
  if (missingAux || extraAux) errors.push("auxiliary");

  const is3rdPerson = /\b(he|she|it)\b/.test(closestExpected);
  if (is3rdPerson && missing.some((t: string) => t.endsWith('s')) && extra.some((t: string) => !t.endsWith('s'))) {
    errors.push("agreement");
  }

  if (/\b(to\s+\w+s|did\s+(?:\w+\s+)?\w+ed|does\s+(?:\w+\s+)?\w+s)\b/.test(normalizedResponse)) {
    errors.push("verb_form");
  }

  if (missing.some((t: string) => t.endsWith('ed')) && extra.some((t: string) => !t.endsWith('ed'))) {
    errors.push("tense");
  }

  const timeMarkers = new Set(["yesterday", "tomorrow", "now", "ago", "last", "next", "always", "sometimes"]);
  if (missing.some((t: string) => timeMarkers.has(t)) || extra.some((t: string) => timeMarkers.has(t))) {
    errors.push("time_marker");
  }

  if (missing.length > 0 && !missingAux && !hasSpellingError) errors.push("missing_word");
  if (extra.length > 0 && !extraAux && !hasSpellingError) errors.push("unnecessary_word");

  const sameTokens = missing.length === 0 && extra.length === 0;
  if (sameTokens && normalizedResponse !== closestExpected) {
    errors.push("word_order");
  }

  if (errors.length === 0) {
    errors.push("meaning_mismatch");
  }

  let level: GrammarEvaluationLevel = "incorrect";
  if (errors.length === 1 && errors[0] === "spelling") {
    level = "understandable_with_grammar_issue";
  }

  return { correct: false, level, errorTypes: Array.from(new Set(errors)) }
}
