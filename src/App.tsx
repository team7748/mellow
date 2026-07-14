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
const GrammarLessonPage = lazy(() =>
  import("./pages/GrammarLessonPage").then((module) => ({
    default: module.GrammarLessonPage,
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

export type AppPage = "home" | "vocabulary" | "wordDetail" | "flashcard" | "quiz" | "speak" | "grammar" | "auth" | "profile"

function readPageFromHash(): { page: AppPage; wordId: string | null; grammarTopicId: string | null } {
  const hash = window.location.hash.replace(/^#/, "")

  if (hash.startsWith("word/")) {
    return { page: "wordDetail", wordId: hash.slice("word/".length) || null, grammarTopicId: null }
  }

  if (hash.startsWith("grammar/")) {
    return { page: "grammar", wordId: null, grammarTopicId: decodeURIComponent(hash.slice("grammar/".length).split("?")[0]) || null }
  }

  const baseHash = hash.split("?")[0]
  if (baseHash === "vocabulary" || baseHash === "flashcard" || baseHash === "quiz" || baseHash === "speak" || baseHash === "auth" || baseHash === "profile") {
    // If there's extra parameters like auth?type=reset, we still just want the base route for the switch
    const basePage = baseHash as AppPage
    return { page: basePage, wordId: null, grammarTopicId: null }
  }

  return { page: "home", wordId: null, grammarTopicId: null }
}

function writePageHash(page: AppPage, wordId: string | null = null) {
  const nextBaseHash =
    page === "home" ? "" : page === "wordDetail" && wordId ? `word/${wordId}` : page

  const currentHash = window.location.hash.replace(/^#/, "")
  const currentBase = currentHash.split("?")[0]
  const currentParams = currentHash.includes("?") ? "?" + currentHash.split("?")[1] : ""

  if (currentBase !== nextBaseHash) {
    window.location.hash = nextBaseHash + currentParams
  }
}

export default function App() {
  const initialRoute = readPageFromHash()
  const [currentPage, setCurrentPage] = useState<AppPage>(initialRoute.page)
  const [selectedWordId, setSelectedWordId] = useState<string | null>(
    initialRoute.wordId,
  )
  const [grammarTopicId, setGrammarTopicId] = useState<string | null>(initialRoute.grammarTopicId)

  useEffect(() => {
    function handleHashChange() {
      const nextRoute = readPageFromHash()
      setCurrentPage(nextRoute.page)
      setSelectedWordId(nextRoute.wordId)
      setGrammarTopicId(nextRoute.grammarTopicId)
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  useEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>(
      "[data-app-scroll-container]",
    )

    if (scrollContainer) {
      scrollContainer.scrollTop = 0
      scrollContainer.scrollLeft = 0
    }
  }, [currentPage, selectedWordId, grammarTopicId])

  function navigate(page: AppPage) {
    setCurrentPage(page)
    setSelectedWordId(null)
    setGrammarTopicId(null)
    writePageHash(page)
  }

  function openWordDetail(wordId: string) {
    setSelectedWordId(wordId)
    setCurrentPage("wordDetail")
    writePageHash("wordDetail", wordId)
  }

  function openVocabularyPage(category?: string) {
    navigate("vocabulary")
    if (category) {
      setTimeout(() => {
        window.location.hash = `vocabulary?category=${encodeURIComponent(category)}`
      }, 0)
    }
  }

  function openFlashcardPage() {
    navigate("flashcard")
  }

  function openGrammarList() {
    setCurrentPage("speak")
    setGrammarTopicId(null)
    window.location.hash = "speak?view=grammar"
  }

  return (
    <AppLayout activePage={currentPage} onNavigate={navigate}>
      <Suspense
        fallback={
          <div
            aria-live="polite"
            className="mx-auto w-full max-w-6xl px-4 py-8 text-ink-DEFAULT sm:px-6 lg:px-8"
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
        ) : currentPage === "grammar" ? (
          <GrammarLessonPage topicId={grammarTopicId ?? ""} onBack={openGrammarList} />
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
