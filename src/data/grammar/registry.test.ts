import { describe, expect, it } from "vitest"
import { getGrammarTopics, getGrammarTopicsByCategory } from "./registry"
import { getNextGrammarTopic, getPreviousGrammarTopic, loadGrammarTopic } from "./loader"

describe("grammar registry", () => {
  it("lists all audited topics in display order", () => expect(getGrammarTopics().map(t => t.displayOrder)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12]))
  it("groups four topics per tense category", () => expect(getGrammarTopicsByCategory("past")).toHaveLength(4))
  it("navigates between adjacent topics", () => { expect(getNextGrammarTopic("topic-present-simple")?.id).toBe("topic-present-continuous"); expect(getPreviousGrammarTopic("topic-present-continuous")?.id).toBe("topic-present-simple") })
  it("returns a controlled error for an unknown topic", async () => expect(await loadGrammarTopic("unknown")).toEqual({ ok:false,error:"topic_not_found" }))
})
