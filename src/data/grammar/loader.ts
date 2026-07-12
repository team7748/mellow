import type { GrammarLoadResult, GrammarTopic } from "../../types/grammar"
import { grammarTopicRegistry, getGrammarTopics } from "./registry"
import { validateGrammarTopic } from "./validation"

const cache = new Map<string, GrammarTopic>()
export async function loadGrammarTopic(id: string): Promise<GrammarLoadResult> {
  const cached = cache.get(id); if (cached) return { ok: true, topic: cached }
  const entry = grammarTopicRegistry.find((topic) => topic.id === id); if (!entry) return { ok: false, error: "topic_not_found" }
  try { const topic = (await entry.loader()).default; if (validateGrammarTopic(topic).length) return { ok: false, error: "validation_failed" }; cache.set(id, topic); return { ok: true, topic } } catch { return { ok: false, error: "load_failed" } }
}
export const getNextGrammarTopic = (id: string) => { const topics=getGrammarTopics(); const i=topics.findIndex(t=>t.id===id); return i >= 0 ? topics[i+1] : undefined }
export const getPreviousGrammarTopic = (id: string) => { const topics=getGrammarTopics(); const i=topics.findIndex(t=>t.id===id); return i > 0 ? topics[i-1] : undefined }
