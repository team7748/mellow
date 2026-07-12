import { Suspense, lazy, useEffect, useState } from "react"
import { AppLayout } from "./components/layout/AppLayout"
import { HomePage } from "./pages/HomePage"

const FlashcardPage = lazy(() =>
  import("./pages/FlashcardPage").then((module) => ({
    default: module.FlashcardPage,
  })),
)
const QuizPage = lazy(() =>
  import("./pages/QuizPage").then((module) => ({ default: module.QuizPage })),
)
const VocabularyPage = lazy(() =>
  import("./pages/VocabularyPage").then((module) => ({
    default: module.VocabularyPage,
  })),
)
const WordDetailPage = lazy(() =>
  import("./pages/WordDetailPage").then((module) => ({
    default: module.WordDetailPage,
  })),
)
const SpeakModePage = lazy(() =>
  import("./pages/SpeakModePage").then((module) => ({
    default: module.SpeakModePage,
  })),
)
const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((module) => ({
    default: module.AuthPage,
  })),
)
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
)
const AuthGuard = lazy(() =>
  import("./components/auth/AuthGuard").then((module) => ({
    default: module.AuthGuard,
  })),
)

export type AppPage = "home" | "vocabulary" | "wordDetail" | "flashcard" | "quiz" | "speak" | "auth" | "profile"

function readPageFromHash(): { page: AppPage; wordId: string | null } {
  const hash = window.location.hash.replace(/^#/, "")

  if (hash.startsWith("word/")) {
    return { page: "wordDetail", wordId: hash.slice("word/".length) || null }
  }

  const baseHash = hash.split("?")[0]
  if (baseHash === "vocabulary" || baseHash === "flashcard" || baseHash === "quiz" || baseHash === "speak" || baseHash === "auth" || baseHash === "profile") {
    // If there's extra parameters like auth?type=reset, we still just want the base route for the switch
    const basePage = baseHash as AppPage
    return { page: basePage, wordId: null }
  }

  return { page: "home", wordId: null }
}

function writePageHash(page: AppPage, wordId: string | null = null) {
  const nextHash =
    page === "home" ? "" : page === "wordDetail" && wordId ? `word/${wordId}` : page

  if (window.location.hash.replace(/^#/, "") !== nextHash) {
    window.location.hash = nextHash
  }
}

export default function App() {
  const initialRoute = readPageFromHash()
  const [currentPage, setCurrentPage] = useState<AppPage>(initialRoute.page)
  const [selectedWordId, setSelectedWordId] = useState<string | null>(
    initialRoute.wordId,
  )

  useEffect(() => {
    function handleHashChange() {
      const nextRoute = readPageFromHash()
      setCurrentPage(nextRoute.page)
      setSelectedWordId(nextRoute.wordId)
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  function navigate(page: AppPage) {
    setCurrentPage(page)
    setSelectedWordId(null)
    writePageHash(page)
  }

  function openWordDetail(wordId: string) {
    setSelectedWordId(wordId)
    setCurrentPage("wordDetail")
    writePageHash("wordDetail", wordId)
  }

  function openVocabularyPage() {
    navigate("vocabulary")
  }

  function openFlashcardPage() {
    navigate("flashcard")
  }

  return (
    <AppLayout activePage={currentPage} onNavigate={navigate}>
      <Suspense
        fallback={
          <div
            aria-live="polite"
            className="mx-auto w-full max-w-6xl px-4 py-8 text-slate-700 sm:px-6 lg:px-8"
            role="status"
          >
            กำลังโหลด...
          </div>
        }
      >
        {currentPage === "home" ? (
          <HomePage
            onOpenVocabulary={openVocabularyPage}
            onStartFlashcard={openFlashcardPage}
          />
        ) : currentPage === "flashcard" ? (
          <FlashcardPage />
        ) : currentPage === "quiz" ? (
          <QuizPage />
        ) : currentPage === "wordDetail" ? (
          <WordDetailPage
            wordId={selectedWordId ?? ""}
            onBack={openVocabularyPage}
          />
        ) : currentPage === "speak" ? (
          <SpeakModePage />
        ) : currentPage === "auth" ? (
          <AuthPage onSuccess={() => navigate("home")} />
        ) : currentPage === "profile" ? (
          <AuthGuard onAuthSuccess={() => navigate("profile")}>
            <ProfilePage />
          </AuthGuard>
        ) : (
          <VocabularyPage onViewDetails={openWordDetail} />
        )}
      </Suspense>
    </AppLayout>
  )
}
