import { Trophy, Clock } from "lucide-react"
import type { SpeakModeProgress, ConversationCategory } from "../../types/conversation"
import { Button } from "../ui/Button"

type Props = {
  progress: SpeakModeProgress
  categories: ConversationCategory[]
  onResume: (categoryId: string, conversationId: string) => void
}

export function SpeakProgressCard({ progress, categories, onResume }: Props) {
  if (!progress.lastCategoryId || !progress.lastConversationId) {
    return null
  }

  const category = categories.find(c => c.id === progress.lastCategoryId)
  if (!category) return null

  const lastDate = progress.lastPracticedDate 
    ? new Date(progress.lastPracticedDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : "วันนี้"

  return (
    <div 
      className="bg-card rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 transition-all duration-200 hover:shadow-soft hover:border-primary/30 cursor-pointer" 
      onClick={() => onResume(progress.lastCategoryId!, progress.lastConversationId!)}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Trophy className="h-6 w-6" />
        </div>
        
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-primary uppercase">เรียนค้างไว้</p>
          <h3 className="font-bold text-ink-dark text-lg truncate mt-0.5">{category.title}</h3>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-ink-secondary font-medium">
            <span className="text-ink-DEFAULT">{category.thaiTitle}</span>
            <span className="text-border">&bull;</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>ฝึกล่าสุด: {lastDate}</span>
            </div>
            <span className="text-border">&bull;</span>
            <span className="font-semibold text-primary">จบแล้ว {progress.completedConversations.length} บท</span>
          </div>
        </div>
      </div>
      
      <div className="w-full sm:w-auto shrink-0">
        <Button 
          variant="primary" 
          className="w-full sm:w-auto font-bold py-2.5 px-5 rounded-xl"
          onClick={(e) => {
            e.stopPropagation()
            onResume(progress.lastCategoryId!, progress.lastConversationId!)
          }}
        >
          ฝึกต่อเลย
        </Button>
      </div>
    </div>
  )
}
