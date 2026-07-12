import presentSimple from "../../present-simple.json"
import { expect, it } from "vitest"
import { grammarStages } from "./grammar"
import type { GrammarTopic } from "./grammar"

it("accepts the audited Present Simple source shape", () => {
  const topic: GrammarTopic = presentSimple

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
