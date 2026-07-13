import { useState } from "react"
import { PenTool, Eye, EyeOff } from "lucide-react"
import type { ConversationPractice } from "../../types/conversation"
import { SpeakButton } from "../ui/SpeakButton"
import { Button } from "../ui/Button"

type Props = {
  questions: ConversationPractice[]
}

export function PracticeQuestionsPanel({ questions }: Props) {
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set())

  if (!questions || questions.length === 0) return null

  const toggleAnswer = (questionNo: number) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev)
      if (next.has(questionNo)) {
        next.delete(questionNo)
      } else {
        next.add(questionNo)
      }
      return next
    })
  }

  return (
    <div className="surface-card">
      <div className="border-b border-border bg-sky-50/50 px-4 py-3 flex items-center gap-2">
        <PenTool className="h-5 w-5 text-sky-600" />
        <h3 className="font-bold text-sky-800">ลองแต่งประโยคตอบคำถาม</h3>
      </div>
      <div className="p-4 space-y-4">
        {questions.map((q) => {
          const isRevealed = revealedAnswers.has(q.questionNo)
          return (
            <div key={q.questionNo} className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex gap-3">
                <span className="font-bold text-sky-600 text-lg">Q:</span>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-ink-DEFAULT text-lg">{q.questionEnglish}</p>
                  <p className="text-ink-secondary">{q.questionThai}</p>
                </div>
                <SpeakButton text={q.questionEnglish} className="shrink-0" />
              </div>
              
              {/* Fake Answer section since answerExample is optional / might not exist in CSV */}
              {q.answerExample && (
                <div className="mt-4 pt-3 border-t border-border">
                  <Button 
                    variant="secondary" 
                    onClick={() => toggleAnswer(q.questionNo)}
                    className="w-full sm:w-auto min-h-[40px] px-3 py-2"
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {isRevealed ? "ซ่อนแนวการตอบ" : "ดูแนวการตอบ"}
                  </Button>
                  
                  {isRevealed && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg flex items-start gap-3">
                      <span className="font-bold text-primary text-lg">A:</span>
                      <p className="font-medium text-ink-DEFAULT mt-0.5">{q.answerExample}</p>
                      <SpeakButton text={q.answerExample} className="shrink-0 ml-auto" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
