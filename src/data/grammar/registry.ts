import type { GrammarTopic, GrammarTopicSummary } from "../../types/grammar"
type Entry = GrammarTopicSummary & { loader: () => Promise<{ default: GrammarTopic }> }
const entries: Entry[] = [
  ["present-simple","present","Present Simple",1],["present-continuous","present","Present Continuous",2],["present-perfect","present","Present Perfect",3],["present-perfect-continuous","present","Present Perfect Continuous",4],["past-simple","past","Past Simple",5],["past-continuous","past","Past Continuous",6],["past-perfect","past","Past Perfect",7],["past-perfect-continuous","past","Past Perfect Continuous",8],["future-simple","future","Future Simple",9],["future-continuous","future","Future Continuous",10],["future-perfect","future","Future Perfect",11],["future-perfect-continuous","future","Future Perfect Continuous",12],
].map(([slug, categoryId, name, displayOrder]) => ({ id: `topic-${slug}`, slug: slug as string, categoryId: categoryId as GrammarTopic["categoryId"], name: name as string, nameThai: "", stage: "beginner", difficulty: 1, displayOrder: displayOrder as number, estimatedMinutes: 0, prerequisites: [], loader: () => import(`../../../${slug}.json`) as Promise<{ default: GrammarTopic }> }))
export const grammarTopicRegistry = entries
export const getGrammarTopics = () => entries.map(({ loader, ...summary }) => summary).sort((a,b) => a.displayOrder-b.displayOrder)
export const getGrammarTopicSummary = (id:string) => getGrammarTopics().find(t=>t.id===id)
export const getGrammarTopicsByCategory = (categoryId: GrammarTopic["categoryId"]) => getGrammarTopics().filter(t=>t.categoryId===categoryId)
