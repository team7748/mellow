import { expect, it } from "vitest"
import { grammarStages } from "./grammar"
import type { GrammarTopic } from "./grammar"

it("describes the audited Present Simple legacy boundary", () => {
  const topic = { id: "topic-present-simple", practice: [{ type: "multiple_choice" }] } as unknown as GrammarTopic

  expect(topic.id).toBe("topic-present-simple")
  expect(topic.practice[0].type).toBe("multiple_choice")
})

it("exposes the supported grammar stages", () => {
  expect(grammarStages).toEqual([
    "foundation",
    "beginner",
    "elementary",
    "intermediate",
  ])
})
