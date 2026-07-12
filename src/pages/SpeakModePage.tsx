import { useState, useEffect, useMemo } from "react"
import { Container } from "../components/layout/Container"
import { ArrowLeft, BookOpen, MessageSquare, MessageSquareOff } from "lucide-react"
import { Button } from "../components/ui/Button"

import {
  fetchConversationCategories,
  fetchConversationLines,
  fetchConversationVocab,
  fetchConversationPractice,
  getSpeakModeProgress,
  saveSpeakModeProgress,
} from "../utils/conversationData"

import type {
  ConversationCategory,
  ConversationLine,
  ConversationVocab,
  ConversationPractice,
  SpeakModeProgress
} from "../types/conversation"

import { CategorySelector } from "../components/speak/CategorySelector"
import { ConversationList } from "../components/speak/ConversationList"
import { ConversationPlayer } from "../components/speak/ConversationPlayer"
import { InteractivePracticePlayer } from "../components/speak/InteractivePracticePlayer"
import { VocabularyPanel } from "../components/speak/VocabularyPanel"
import { SpeakProgressCard } from "../components/speak/SpeakProgressCard"
import { getGrammarTopics } from "../data/grammar/registry"

export function SpeakModePage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<ConversationCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [showGrammar, setShowGrammar] = useState(false)
  const [viewMode, setViewMode] = useState<"conversation" | "practice">("conversation")
  const [progress, setProgress] = useState<SpeakModeProgress>(getSpeakModeProgress())

  // Data for selected category
  const [lines, setLines] = useState<ConversationLine[]>([])
  const [vocab, setVocab] = useState<ConversationVocab[]>([])
  const [practice, setPractice] = useState<ConversationPractice[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  useEffect(() => {
    fetchConversationCategories().then(data => {
      setCategories(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (selectedCategoryId) {
      setLoading(true)
      Promise.all([
        fetchConversationLines(selectedCategoryId),
        fetchConversationVocab(selectedCategoryId),
        fetchConversationPractice(selectedCategoryId)
      ]).then(([l, v, p]) => {
        setLines(l)
        setVocab(v)
        setPractice(p)
        setLoading(false)
        
        // Auto-select first conversation if none selected
        if (!selectedConversationId && l.length > 0) {
          const firstConvId = l[0].conversationId
          handleSelectConversation(firstConvId)
        }
      })
    }
  }, [selectedCategoryId])

  const conversationTitles = useMemo(() => {
    const map = new Map<string, string>()
    lines.forEach(line => {
      if (!map.has(line.conversationId)) {
        map.set(line.conversationId, line.conversationTitle)
      }
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [lines])

  const activeLines = useMemo(() => {
    if (!selectedConversationId) return []
    return lines.filter(l => l.conversationId === selectedConversationId).sort((a, b) => a.lineNo - b.lineNo)
  }, [lines, selectedConversationId])

  const activeConversationTitle = useMemo(() => {
    return conversationTitles.find(c => c.id === selectedConversationId)?.title || "บทสนทนา"
  }, [conversationTitles, selectedConversationId])

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setSelectedConversationId(null)
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    
    // Update progress safely using functional update
    if (selectedCategoryId) {
      setProgress(prev => {
        const newProgress = {
          ...prev,
          lastCategoryId: selectedCategoryId,
          lastConversationId: conversationId,
          lastPracticedDate: new Date().toISOString()
        }
        saveSpeakModeProgress(newProgress)
        return newProgress
      })
    }
  }

  const handleConversationComplete = () => {
    if (selectedConversationId) {
      // 1. Update progress
      setProgress(prev => {
        if (!prev.completedConversations.includes(selectedConversationId)) {
          const newProgress = {
            ...prev,
            completedConversations: [...prev.completedConversations, selectedConversationId]
          }
          saveSpeakModeProgress(newProgress)
          return newProgress
        }
        return prev
      })

      // 2. Navigate to next conversation or practice mode
      const currentIndex = conversationTitles.findIndex(c => c.id === selectedConversationId)
      if (currentIndex >= 0) {
        if (currentIndex < conversationTitles.length - 1) {
          const nextConvId = conversationTitles[currentIndex + 1].id
          handleSelectConversation(nextConvId)
        } else {
          setViewMode("practice")
        }
      }
    }
  }

  if (loading && !selectedCategoryId && categories.length === 0) {
    return (
      <Container className="py-8 sm:py-10">
        <div className="flex justify-center p-12">
          <p className="text-slate-500">กำลังโหลด...</p>
        </div>
      </Container>
    )
  }

  // 1. View: Category Selection
  if (!selectedCategoryId) {
    if (showGrammar) return <Container className="py-8 sm:py-10 space-y-6"><button onClick={() => setShowGrammar(false)} className="inline-flex items-center text-sm font-medium text-slate-500"><ArrowLeft className="mr-1 h-4 w-4" />กลับ</button><h1 className="text-3xl font-extrabold text-ink">Grammar</h1><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{getGrammarTopics().map(t => <article key={t.id} className="surface-card p-5"><h2 className="font-bold text-ink">{t.name}</h2><p className="text-slate-600">{t.nameThai}</p></article>)}</div></Container>
    return (
      <Container className="py-8 sm:py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-leaf">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-ink">Speak Mode</h1>
            </div>
            <p className="mt-2 text-slate-600 text-lg">ฝึกบทสนทนาภาษาอังกฤษตามสถานการณ์</p>
          </div>
        </div>

        {/* Progress Card (If any) */}
        <SpeakProgressCard 
          progress={progress} 
          categories={categories} 
          onResume={handleSelectCategory} 
        />

        <section>
          <h2 className="text-xl font-bold text-ink mb-4">เลือกหมวดหมู่ที่ต้องการฝึก</h2>
          <button onClick={() => setShowGrammar(true)} className="surface-card mb-4 flex w-full items-center gap-3 p-5 text-left"><BookOpen className="h-6 w-6 text-leaf" /><span><strong className="block text-ink">Grammar</strong><span className="text-slate-600">12 Tenses</span></span></button>
          <CategorySelector categories={categories} onSelect={handleSelectCategory} />
        </section>
      </Container>
    )
  }

  const currentCategory = categories.find(c => c.id === selectedCategoryId)

  // 2. View: Conversation Practice
  return (
    <Container className="py-8 sm:py-10 space-y-6">
      <div className="mb-2">
        <button 
          onClick={() => setSelectedCategoryId(null)}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-leaf focus:ring-offset-2 rounded"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          กลับไปเลือกหมวดหมู่
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: List & Vocab */}
        <div className="lg:w-1/3 space-y-6">
          <div className="surface-card p-5">
            <h2 className="text-xl font-bold text-ink">{currentCategory?.title}</h2>
            <p className="text-slate-600">{currentCategory?.thaiTitle}</p>
          </div>

          <ConversationList 
            conversationTitles={conversationTitles}
            activeConversationId={selectedConversationId || undefined}
            onSelect={handleSelectConversation}
          />

          <div className="hidden lg:block space-y-6">
            <VocabularyPanel vocabList={vocab} />
          </div>
        </div>

        {/* Right Column: Player / Practice */}
        <div className="lg:w-2/3 min-h-[600px] flex flex-col gap-4">
          
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("conversation")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 active:scale-[0.98] ${
                viewMode === "conversation" ? "bg-white text-leaf shadow-sm ring-1 ring-slate-200/50" : "text-slate-600 hover:text-ink hover:bg-slate-200/50"
              }`}
            >
              อ่านบทสนทนา
            </button>
            <button
              onClick={() => setViewMode("practice")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 active:scale-[0.98] ${
                viewMode === "practice" ? "bg-white text-leaf shadow-sm ring-1 ring-slate-200/50" : "text-slate-600 hover:text-ink hover:bg-slate-200/50"
              }`}
            >
              ฝึกตอบคำถาม (Practice)
            </button>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="surface-card w-full h-full flex items-center justify-center min-h-[400px]">
                <p className="text-slate-500">กำลังโหลดข้อมูล...</p>
              </div>
            ) : viewMode === "practice" ? (
              <InteractivePracticePlayer 
                categoryTitle={currentCategory?.title || ""}
                questions={practice} 
              />
            ) : selectedConversationId && activeLines.length > 0 ? (
              <ConversationPlayer 
                title={activeConversationTitle} 
                lines={activeLines} 
                onComplete={handleConversationComplete}
              />
            ) : (
              <div className="surface-card w-full h-full flex flex-col items-center justify-center text-center p-6 min-h-[400px]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
                  <MessageSquareOff className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-ink">ไม่พบข้อมูลบทสนทนา</h3>
                <p className="mt-2 text-slate-500">ลองเลือกหมวดหมู่ใหม่ หรือรอการอัปเดตเร็วๆ นี้นะครับ</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile-only Vocab */}
        <div className="lg:hidden space-y-6 w-full">
          <VocabularyPanel vocabList={vocab} />
        </div>
      </div>
    </Container>
  )
}
