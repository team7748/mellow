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

  // We could fetch the specific conversation title, but for now we'll display the category
  const lastDate = progress.lastPracticedDate 
    ? new Date(progress.lastPracticedDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : "วันนี้"

  return (
    <div className="surface-card flex flex-col sm:flex-row items-center gap-4 p-5 bg-gradient-to-r from-leaf/10 to-transparent border-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer" onClick={() => onResume(progress.lastCategoryId!, progress.lastConversationId!)}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
        <Trophy className="h-6 w-6" />
      </div>
      
      <div className="flex-1 text-center sm:text-left">
        <h3 className="font-bold text-ink-DEFAULT">เรียนค้างไว้: {category.title}</h3>
        <p className="text-sm text-ink-secondary font-medium mt-1">{category.thaiTitle}</p>
        
        <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-xs text-ink-secondary">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>ฝึกล่าสุด: {lastDate}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-primary">
            <span>จบแล้ว {progress.completedConversations.length} บท</span>
          </div>
        </div>
      </div>
      
      <div className="w-full sm:w-auto">
        <Button 
          variant="primary" 
          className="w-full sm:w-auto"
          onClick={() => onResume(progress.lastCategoryId!, progress.lastConversationId!)}
        >
          ฝึกต่อเลย
        </Button>
      </div>
    </div>
  )
}
