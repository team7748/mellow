import { MessageCircle, FileText, BookOpen, PenTool } from "lucide-react"
import type { ConversationCategory } from "../../types/conversation"
import { Button } from "../ui/Button"

type Props = {
  categories: ConversationCategory[]
  onSelect: (categoryId: string) => void
}

export function CategorySelector({ categories, onSelect }: Props) {
  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="surface-card flex flex-col p-5 hover:border-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] cursor-pointer group"
          onClick={() => onSelect(category.id)}
        >
          <div className="flex-1">
            <h3 className="text-xl font-bold text-ink-DEFAULT group-hover:text-primary transition-colors">
              {category.title}
            </h3>
            <p className="mt-1 text-ink-secondary font-medium">{category.thaiTitle}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:text-sm text-ink-secondary">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                <span>{category.conversationCount} บทสนทนา</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>{category.lineCount} ประโยค</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>{category.vocabCount} คำศัพท์</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PenTool className="h-4 w-4" />
                <span>{category.practiceCount} คำถาม</span>
              </div>
            </div>
          </div>
          
          <div className="mt-5">
            <Button variant="secondary" className="w-full justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary">
              เริ่มฝึกหมวดนี้
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
