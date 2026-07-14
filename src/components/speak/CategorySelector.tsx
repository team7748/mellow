import { MessageCircle, FileText, BookOpen, PenTool } from "lucide-react"
import type { ConversationCategory } from "../../types/conversation"
import { Button } from "../ui/Button"

type Props = {
  categories: ConversationCategory[]
  onSelect: (categoryId: string) => void
}

export function CategorySelector({ categories, onSelect }: Props) {
  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="bg-card rounded-2xl border border-border flex min-h-full flex-col p-4 sm:p-5 transition-all duration-200 hover:shadow-soft hover:border-primary/30 cursor-pointer group"
          onClick={() => onSelect(category.id)}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-ink-dark group-hover:text-primary transition-colors truncate">
              {category.title}
            </h3>
            <p className="mt-1 text-sm font-medium text-ink-secondary">{category.thaiTitle}</p>
            
            <div className="mt-4 space-y-2 border-t border-border/40 pt-3 text-sm text-ink-secondary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-ink-secondary/50" />
                  <span>บทสนทนา</span>
                </div>
                <span className="font-semibold text-ink-DEFAULT">{category.conversationCount} บท</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-ink-secondary/50" />
                  <span>ประโยค</span>
                </div>
                <span className="font-semibold text-ink-DEFAULT">{category.lineCount} ประโยค</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-ink-secondary/50" />
                  <span>คำศัพท์</span>
                </div>
                <span className="font-semibold text-ink-DEFAULT">{category.vocabCount} คำ</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-ink-secondary/50" />
                  <span>คำถามฝึกฝน</span>
                </div>
                <span className="font-semibold text-ink-DEFAULT">{category.practiceCount} ข้อ</span>
              </div>
            </div>
          </div>
          
          <div className="mt-5">
            <Button 
              variant="secondary" 
              className="w-full justify-center rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary"
            >
              เริ่มฝึกหมวดนี้
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
