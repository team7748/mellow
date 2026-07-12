import { grammarQuestionTypes, grammarStages, type GrammarTopic, type GrammarValidationIssue } from "../../types/grammar"

export function validateGrammarTopic(topic: GrammarTopic): GrammarValidationIssue[] {
  const issues: GrammarValidationIssue[] = []
  if (!topic.id || !topic.name || !grammarStages.includes(topic.stage)) issues.push({ code: "invalid_topic", topicId: topic.id, path: "$", message: "Missing required topic metadata" })
  if (!Number.isInteger(topic.difficulty) || topic.difficulty < 1 || topic.difficulty > 5) issues.push({ code: "invalid_difficulty", topicId: topic.id, path: "$.difficulty", message: "Difficulty must be 1–5" })
  for (const question of topic.practice) {
    if (!grammarQuestionTypes.includes(question.type)) issues.push({ code: "invalid_question_type", topicId: topic.id, path: `$.practice[${question.id}].type`, message: "Unsupported question type" })
    if (question.type === "multiple_choice" && !question.options.includes(question.answer)) issues.push({ code: "answer_not_in_options", topicId: topic.id, path: `$.practice[${question.id}].answer`, message: "Answer is not an option" })
  }
  return issues
}

export function validateGrammarCorpus(topics: readonly GrammarTopic[]): GrammarValidationIssue[] {
  const issues = topics.flatMap(validateGrammarTopic); const ids = new Set<string>(); const orders = new Set<number>()
  for (const topic of topics) { if (ids.has(topic.id)) issues.push({ code: "duplicate_topic_id", topicId: topic.id, path: "$.id", message: "Duplicate topic ID" }); ids.add(topic.id); if (orders.has(topic.displayOrder)) issues.push({ code: "duplicate_display_order", topicId: topic.id, path: "$.displayOrder", message: "Duplicate display order" }); orders.add(topic.displayOrder) }
  for (const topic of topics) for (const prerequisite of topic.prerequisites) if (!ids.has(prerequisite)) issues.push({ code: "unknown_prerequisite", topicId: topic.id, path: "$.prerequisites", message: `Unknown prerequisite: ${prerequisite}` })
  return issues
}
