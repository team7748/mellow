import { useState, useEffect } from "react"
import { SearchX } from "lucide-react"
import { PageContainer } from "../components/layout/PageContainer"
import { SpeechSettings } from "../components/settings/SpeechSettings"
import { Button } from "../components/ui/Button"
import { VocabularyCard } from "../components/vocabulary/VocabularyCard"
import { VocabularyFilters } from "../components/vocabulary/VocabularyFilters"
import type { CefrLevel, PartOfSpeech, VocabCategory, VocabLevel, WordStatus } from "../types/vocabulary"
import { getWordStatus, getAllVocabulary } from "../utils/vocabulary"
import { PageHeader } from "../components/layout/PageHeader"

import { useVocabularyFilter } from "../hooks/useVocabularyFilter"

type VocabularyPageProps = {
  onViewDetails?: (id: string) => void
}

export function VocabularyPage({ onViewDetails }: VocabularyPageProps) {
  const initialCategory = (() => {
    try {
      const hashParams = window.location.hash.split('?')[1]
      if (hashParams) {
        const params = new URLSearchParams(hashParams)
        const cat = params.get('category')
        if (cat) return cat as VocabCategory
      }
    } catch {
      // ignore
    }
    return "all"
  })();

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCefr, setSelectedCefr] = useState<"all" | CefrLevel>("all")
  const [selectedStatus, setSelectedStatus] = useState<"all" | WordStatus>("all")
  const [selectedCategory, setSelectedCategory] = useState<"all" | VocabCategory>(initialCategory)
  const [selectedPos, setSelectedPos] = useState<"all" | PartOfSpeech>("all")
  const [selectedLevel, setSelectedLevel] = useState<"all" | VocabLevel>("all")
  const [visibleCount, setVisibleCount] = useState(30)

  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hashParams = window.location.hash.split('?')[1]
        if (hashParams) {
          const params = new URLSearchParams(hashParams)
          const cat = params.get('category')
          if (cat) setSelectedCategory(cat as VocabCategory)
        }
      } catch {
        // Ignore malformed hash parameters and keep the current filter.
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const filteredWords = useVocabularyFilter({
    searchTerm,
    selectedCefr,
    selectedStatus,
    selectedCategory,
    selectedPos,
    selectedLevel,
  })

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(30)
  }, [filteredWords])

  const visibleWords = filteredWords.slice(0, visibleCount)

  function startFlashcard() {
    window.location.hash = "flashcard"
  }

  function resetFilters() {
    setSearchTerm("")
    setSelectedCefr("all")
    setSelectedStatus("all")
    setSelectedCategory("all")
    setSelectedPos("all")
    setSelectedLevel("all")
  }

  return (
    <PageContainer className="py-8 sm:py-10">
      <PageHeader
        subtitle="คลังคำศัพท์"
        title="คลังคำศัพท์"
        description={
          <>ค้นหาและกรองคำศัพท์จากชุดเริ่มต้น {getAllVocabulary().length} คำ <br className="hidden sm:block" />
          พร้อมดูหมวดหมู่ ชนิดของคำ ระดับความยาก และสถานะการเรียน</>
        }
        rightContent={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              aria-label={`${filteredWords.length} ผลลัพธ์`}
              className="bg-primary-soft border border-primary/20 rounded-2xl px-4 py-3 text-center sm:min-w-28"
              role="status"
            >
              <p className="text-2xl font-black text-ink-dark">{filteredWords.length}</p>
              <p className="text-xs font-bold text-ink-dark uppercase">ผลลัพธ์</p>
            </div>
            <Button
              disabled={filteredWords.length === 0}
              onClick={startFlashcard}
              className="w-full sm:w-auto font-bold py-3 px-6"
            >
              ฝึกด้วย Flashcard
            </Button>
          </div>
        }
      />

      <div className="mb-6 rounded-2xl bg-card p-4 sm:p-6 shadow-sm border border-border">
        <VocabularyFilters
          searchTerm={searchTerm}
          selectedCefr={selectedCefr}
          selectedStatus={selectedStatus}
          selectedCategory={selectedCategory}
          selectedPos={selectedPos}
          selectedLevel={selectedLevel}
          onSearchChange={setSearchTerm}
          onCefrChange={setSelectedCefr}
          onStatusChange={setSelectedStatus}
          onCategoryChange={setSelectedCategory}
          onPosChange={setSelectedPos}
          onLevelChange={setSelectedLevel}
        />
      </div>

      <div className="mt-4">
        <SpeechSettings />
      </div>

      {filteredWords.length > 0 ? (
        <section className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleWords.map((word) => (
              <VocabularyCard
                key={word.id}
                vocabulary={word}
                status={getWordStatus(word.id)}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
          
          {visibleCount < filteredWords.length && (
            <div className="mt-8 flex justify-center">
              <Button 
                variant="secondary" 
                onClick={() => setVisibleCount(prev => prev + 30)}
                className="w-full sm:w-auto px-8"
              >
                โหลดเพิ่มเติม ({filteredWords.length - visibleCount} คำ)
              </Button>
            </div>
          )}
        </section>
      ) : (
        <section className="empty-state mt-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft mb-4 text-primary">
            <SearchX className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-ink-DEFAULT">ไม่พบคำศัพท์ที่ตรงกับตัวกรอง</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            ลองลดเงื่อนไขการค้นหาลง หรือล้างตัวกรองเพื่อดูคำศัพท์ทั้งหมดนะ
          </p>
          <Button className="mt-5 w-full sm:w-auto" variant="secondary" onClick={resetFilters}>
            ล้างตัวกรองทั้งหมด
          </Button>
        </section>
      )}
    </PageContainer>
  )
}
