import { BookOpen } from "lucide-react"
import type { ConversationVocab } from "../../types/conversation"
import { SpeakButton } from "../ui/SpeakButton"

type Props = {
  vocabList: ConversationVocab[]
}

export function VocabularyPanel({ vocabList }: Props) {
  if (!vocabList || vocabList.length === 0) return null

  return (
    <section className="surface-card overflow-hidden" aria-labelledby="lesson-vocabulary-title">
      <header className="flex items-center gap-2 border-b border-border bg-slate-50/70 px-4 py-3">
        <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <h3 id="lesson-vocabulary-title" className="text-sm font-bold text-ink-DEFAULT">
          คำศัพท์ในบท
        </h3>
      </header>

      <ul className="divide-y divide-slate-200">
        {vocabList.map((vocab) => (
          <li key={`${vocab.vocabNo}-${vocab.word}`} className="flex min-w-0 items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-bold leading-6 text-primary">{vocab.word}</p>
              {vocab.thaiMeaning && (
                <p className="mt-0.5 break-words text-sm leading-6 text-ink-secondary">{vocab.thaiMeaning}</p>
              )}
            </div>
            <SpeakButton
              text={vocab.word}
              label={`ฟังเสียง ${vocab.word}`}
              className="!min-h-9 !min-w-9 !p-1.5"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
