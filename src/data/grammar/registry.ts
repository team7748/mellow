import type { GrammarTopic, GrammarTopicSummary } from "../../types/grammar"

type Entry = GrammarTopicSummary & { loader: () => Promise<{ default: GrammarTopic }> }
const source = [
  ["present-simple","present","Present Simple","ปัจจุบันกาลแบบธรรมดา","beginner",1,1,20,[]],
  ["present-continuous","present","Present Continuous","ปัจจุบันกาลแบบกำลังกระทำ","beginner",1,2,20,["topic-present-simple"]],
  ["present-perfect","present","Present Perfect","ปัจจุบันสมบูรณ์","elementary",3,3,25,["topic-present-simple","topic-past-simple"]],
  ["present-perfect-continuous","present","Present Perfect Continuous","ปัจจุบันสมบูรณ์แบบต่อเนื่อง","intermediate",4,4,25,["topic-present-perfect","topic-present-continuous"]],
  ["past-simple","past","Past Simple","อดีตกาลแบบธรรมดา","beginner",2,5,20,["topic-present-simple"]],
  ["past-continuous","past","Past Continuous","อดีตกาลแบบกำลังกระทำ","elementary",3,6,20,["topic-past-simple","topic-present-continuous"]],
  ["past-perfect","past","Past Perfect","อดีตกาลสมบูรณ์","intermediate",4,7,25,["topic-past-simple","topic-present-perfect"]],
  ["past-perfect-continuous","past","Past Perfect Continuous","อดีตกาลสมบูรณ์แบบต่อเนื่อง","intermediate",5,8,25,["topic-past-perfect","topic-past-continuous"]],
  ["future-simple","future","Future Simple","อนาคตกาลแบบธรรมดา","beginner",2,9,20,["topic-present-simple"]],
  ["future-continuous","future","Future Continuous","อนาคตกาลแบบกำลังกระทำ","elementary",3,10,20,["topic-future-simple","topic-present-continuous"]],
  ["future-perfect","future","Future Perfect","อนาคตกาลสมบูรณ์","intermediate",4,11,25,["topic-future-simple","topic-present-perfect"]],
  ["future-perfect-continuous","future","Future Perfect Continuous","อนาคตกาลสมบูรณ์แบบต่อเนื่อง","intermediate",5,12,25,["topic-future-perfect","topic-future-continuous"]],
] as const
export const grammarTopicRegistry: Entry[] = source.map(([slug,categoryId,name,nameThai,stage,difficulty,displayOrder,estimatedMinutes,prerequisites]) => ({ id:`topic-${slug}`,slug,categoryId,name,nameThai,stage,difficulty,displayOrder,estimatedMinutes,prerequisites:[...prerequisites],loader:()=>import(`../../../${slug}.json`) as Promise<{default:GrammarTopic}> }))
export const getGrammarTopics=()=>grammarTopicRegistry.map((entry) => ({
  id: entry.id,
  slug: entry.slug,
  categoryId: entry.categoryId,
  name: entry.name,
  nameThai: entry.nameThai,
  stage: entry.stage,
  difficulty: entry.difficulty,
  displayOrder: entry.displayOrder,
  estimatedMinutes: entry.estimatedMinutes,
  prerequisites: entry.prerequisites,
})).sort((a,b)=>a.displayOrder-b.displayOrder)
export const getGrammarTopicSummary=(id:string)=>getGrammarTopics().find(t=>t.id===id)
export const getGrammarTopicsByCategory=(categoryId:GrammarTopic["categoryId"])=>getGrammarTopics().filter(t=>t.categoryId===categoryId)
