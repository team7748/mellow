import { useState } from "react"
import { AppLayout } from "./components/layout/AppLayout"
import { FlashcardPage } from "./pages/FlashcardPage"
import { HomePage } from "./pages/HomePage"
import { QuizPage } from "./pages/QuizPage"
import { VocabularyPage } from "./pages/VocabularyPage"
import { WordDetailPage } from "./pages/WordDetailPage"

export type AppPage = "home" | "vocabulary" | "wordDetail" | "flashcard" | "quiz"

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>("home")
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)

  function openWordDetail(wordId: string) {
    setSelectedWordId(wordId)
    setCurrentPage("wordDetail")
  }

  function openVocabularyPage() {
    setCurrentPage("vocabulary")
  }

  return (
    <AppLayout activePage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === "home" ? (
        <HomePage onOpenVocabulary={openVocabularyPage} />
      ) : currentPage === "flashcard" ? (
        <FlashcardPage />
      ) : currentPage === "quiz" ? (
        <QuizPage />
      ) : currentPage === "wordDetail" ? (
        <WordDetailPage
          wordId={selectedWordId ?? ""}
          onBack={openVocabularyPage}
        />
      ) : (
        <VocabularyPage onViewDetails={openWordDetail} />
      )}
    </AppLayout>
  )
}
