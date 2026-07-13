import { User } from "lucide-react"
import type { ConversationLine } from "../../types/conversation"
import { SpeakButton } from "../ui/SpeakButton"

type Props = {
  line: ConversationLine
  showThai: boolean
  isActive: boolean
}

export function ConversationLineCard({ line, showThai, isActive }: Props) {
  // Speaker colors for visual distinction
  const isSpeakerA = line.speaker.toUpperCase().includes('A') || line.speaker.trim() === 'Speaker 1'
  const speakerBadgeColor = isSpeakerA ? "bg-primary-active text-ink-dark" : "bg-amber-100 text-amber-800"
  const speakerIconColor = isSpeakerA ? "text-primary" : "text-amber-600"
  
  return (
    <div className={`transition-all duration-300 rounded-xl border p-4 sm:p-5 ${isActive ? 'border-primary bg-card shadow-md scale-[1.02]' : 'border-border bg-slate-50/50 opacity-60'}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Speaker Badge */}
        <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:w-24 shrink-0">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${speakerBadgeColor}`}>
            <User className={`w-5 h-5 ${speakerIconColor}`} />
          </div>
          <span className={`font-bold text-sm ${speakerIconColor}`}>{line.speaker}</span>
        </div>
        
        {/* Sentence Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <p className={`text-xl font-medium leading-relaxed ${isActive ? 'text-ink-DEFAULT' : 'text-ink-secondary'}`}>
              {line.english}
            </p>
            {isActive && <SpeakButton text={line.english} pitch={isSpeakerA ? 1 : 0.7} className="mt-1 shrink-0" />}
          </div>
          
          <div className={`transition-all duration-300 overflow-hidden ${showThai || isActive ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            {showThai && (
              <p className="text-lg text-ink-secondary border-l-4 border-border pl-3">
                {line.thai}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
