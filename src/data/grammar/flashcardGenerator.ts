import type { GrammarTopic, GrammarComparison } from "../../types/grammar"
import type { UnifiedFlashcard } from "../../types/flashcardItem"

export function generateGrammarFlashcards(topics: GrammarTopic[]): UnifiedFlashcard[] {
  const cards: UnifiedFlashcard[] = [];

  for (const topic of topics) {
    // 1. Explicit Flashcards (type: rule)
    for (const fc of topic.flashcards) {
      cards.push({
        id: fc.id,
        type: "rule",
        front: fc.front,
        back: fc.back,
        example: fc.example,
        topicId: topic.id,
        patternId: `rule-${fc.id}`,
        variationGroupId: fc.id
      });
    }

    // 2. Common Mistakes
    for (const mistake of topic.commonMistakes) {
      cards.push({
        id: mistake.id,
        type: "common_mistake",
        front: mistake.incorrect,
        back: mistake.correct,
        note: mistake.explanationThai,
        topicId: topic.id,
        patternId: `mistake-${mistake.id}`,
        variationGroupId: mistake.id
      });
    }

    // 3. Comparisons
    for (const comp of topic.comparisons) {
      const keys = Object.keys(comp).filter(k => k !== "id" && k !== "title" && k !== "keyDifferenceThai");
      const side1 = comp[keys[0] as keyof GrammarComparison] as any;
      const side2 = comp[keys[1] as keyof GrammarComparison] as any;
      cards.push({
        id: comp.id,
        type: "compare",
        front: comp.title,
        back: comp.keyDifferenceThai,
        note: `${side1?.name || keys[0]}: ${side1?.example}\n${side2?.name || keys[1]}: ${side2?.example}`,
        topicId: topic.id,
        patternId: `compare-${comp.id}`,
        variationGroupId: comp.id
      });
    }

    // 4. Examples -> Translation cards (Groups by usage to provide variations)
    for (const ex of topic.examples) {
      cards.push({
        id: ex.id,
        type: "rule",
        front: ex.translation,
        back: ex.sentence,
        note: `Focus: ${ex.focus}`,
        topicId: topic.id,
        patternId: `usage-${ex.usage}`, // Shared pattern ID for variations
        variationGroupId: ex.id
      });
    }

    // 5. Practice Questions
    for (const p of topic.practice) {
      if (p.type === "fill_blank") {
        cards.push({
          id: p.id,
          type: "fill_blank",
          front: p.question as string,
          back: p.answer as string,
          note: p.explanationThai,
          topicId: topic.id,
          patternId: `practice-${p.id}`,
          variationGroupId: p.id
        });
      } else if (p.type === "multiple_choice") {
        cards.push({
          id: p.id,
          type: "fill_blank",
          front: p.question as string,
          back: p.answer as string,
          note: p.explanationThai,
          options: p.options,
          topicId: topic.id,
          patternId: `practice-${p.id}`,
          variationGroupId: p.id
        });
      } else if (p.type === "correct_or_incorrect") {
        cards.push({
          id: p.id,
          type: "correct_or_incorrect",
          front: p.question as string,
          back: p.answer as string,
          note: p.explanationThai,
          topicId: topic.id,
          patternId: `practice-${p.id}`,
          variationGroupId: p.id
        });
      }
    }
  }

  return cards;
}
