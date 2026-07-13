import { useState, useEffect } from "react"
import { FlashcardPractice } from "../flashcard/FlashcardPractice"
import { getGrammarTopicSummary, grammarTopicRegistry } from "../../data/grammar/registry"
import { generateGrammarFlashcards } from "../../data/grammar/flashcardGenerator"
import type { UnifiedFlashcard } from "../../types/flashcardItem"
import type { GrammarTopic } from "../../types/grammar"
import { Loader2 } from "lucide-react"

type GrammarMiniPracticeProps = {
  topicId: string
  onComplete: () => void
  onClose: () => void
}

export function GrammarMiniPractice({
  topicId,
  onComplete,
  onClose,
}: GrammarMiniPracticeProps) {
  const [cards, setCards] = useState<UnifiedFlashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const summary = getGrammarTopicSummary(topicId)
        if (!summary) {
          throw new Error("Topic not found")
        }

        const entry = grammarTopicRegistry.find(r => r.id === topicId)
        const loaded = entry ? await entry.loader() : { default: summary as unknown as GrammarTopic }
        
        if (!active) return

        const allCards = generateGrammarFlashcards([loaded.default])
        
        // Shuffle and take 3
        const shuffled = [...allCards].sort(() => Math.random() - 0.5)
        setCards(shuffled.slice(0, 3))
      } catch (err) {
        console.error("Failed to load mini practice cards", err)
        setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [topicId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] surface-card p-6 rounded-xl">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-ink-secondary font-medium">กำลังเตรียมโจทย์ทบทวนไวยากรณ์...</p>
      </div>
    )
  }

  if (error || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] surface-card p-6 rounded-xl text-center">
        <p className="text-rose-500 font-semibold mb-4">ไม่สามารถโหลดโจทย์ไวยากรณ์ได้ในขณะนี้</p>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 text-ink-DEFAULT font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          กลับไปตอบคำถามต่อ
        </button>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <FlashcardPractice
        cards={cards}
        onComplete={() => {
          onComplete()
        }}
        onBack={onClose}
      />
    </div>
  )
}
