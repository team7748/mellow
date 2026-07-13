import { PlayCircle } from "lucide-react"

type Props = {
  conversationTitles: { id: string; title: string }[]
  onSelect: (conversationId: string) => void
  activeConversationId?: string
}

export function ConversationList({ conversationTitles, onSelect, activeConversationId }: Props) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border bg-slate-50/80 px-4 py-3">
        <h3 className="font-bold text-ink-DEFAULT">เลือกบทสนทนา</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {conversationTitles.length === 0 ? (
          <li className="px-4 py-8 text-center">
            <p className="text-ink-secondary font-medium">ยังไม่มีบทสนทนาในหมวดหมู่นี้</p>
            <p className="text-sm text-ink-secondary mt-1">ทีมงานกำลังเร่งเพิ่มเนื้อหาใหม่ๆ เข้ามาครับ</p>
          </li>
        ) : (
          conversationTitles.map((conv, idx) => {
          const isActive = activeConversationId === conv.id
          return (
            <li key={conv.id}>
              <button
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-slate-50 ${
                  isActive ? "bg-primary" : ""
                }`}
              >
                <div className={`shrink-0 ${isActive ? "text-primary" : "text-slate-300"}`}>
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${isActive ? "text-primary" : "text-ink-DEFAULT"}`}>
                    บทที่ {idx + 1}: {conv.title}
                  </p>
                </div>
              </button>
            </li>
          )
        }))}
      </ul>
    </div>
  )
}
