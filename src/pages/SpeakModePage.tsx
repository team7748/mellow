import { useState, useEffect, useMemo, useRef } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import {
  ArrowLeft,
  BookOpen,
  MessageSquareOff,
  Info,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/layout/PageHeader";

import {
  fetchConversationCategories,
  fetchConversationLines,
  fetchConversationVocab,
  fetchConversationPractice,
  getSpeakModeProgress,
  saveSpeakModeProgress,
} from "../utils/conversationData";

import type {
  ConversationCategory,
  ConversationLine,
  ConversationVocab,
  ConversationPractice,
  SpeakModeProgress,
} from "../types/conversation";

import { CategorySelector } from "../components/speak/CategorySelector";
import { ConversationList } from "../components/speak/ConversationList";
import { ConversationPlayer } from "../components/speak/ConversationPlayer";
import { InteractivePracticePlayer } from "../components/speak/InteractivePracticePlayer";
import { VocabularyPanel } from "../components/speak/VocabularyPanel";
import { SpeakProgressCard } from "../components/speak/SpeakProgressCard";
import { getGrammarTopics } from "../data/grammar/registry";
import { recordLearningActivity } from "../lib/activity/recordLearningActivity";

const tenseSummaries: Record<string, string> = {
  "topic-present-simple":
    "ใช้ Present Simple เพื่อพูดถึงกิจวัตร สิ่งที่เกิดขึ้นเป็นประจำ ข้อเท็จจริง และตารางเวลาที่กำหนดไว้",
  "topic-present-continuous":
    "ใช้ Present Continuous เพื่อพูดถึงเหตุการณ์ที่กำลังเกิดขึ้นตอนนี้ สถานการณ์ชั่วคราว การเปลี่ยนแปลงที่กำลังดำเนินอยู่ และแผนที่นัดหมายไว้ในอนาคตอันใกล้",
  "topic-present-perfect":
    "ใช้ Present Perfect เพื่อพูดถึงประสบการณ์ เหตุการณ์ในอดีตที่ยังมีผลถึงปัจจุบัน เหตุการณ์ที่เพิ่งเกิดขึ้น และเหตุการณ์ในช่วงเวลาที่ยังไม่จบ",
  "topic-present-perfect-continuous":
    "ใช้ Present Perfect Continuous เพื่อพูดถึงการกระทำที่เริ่มในอดีตและยังดำเนินอยู่ การกระทำที่เพิ่งหยุดแต่ยังเห็นผลในปัจจุบัน และกิจกรรมที่ต้องการเน้นระยะเวลา",
  "topic-past-simple":
    "ใช้ Past Simple เพื่อพูดถึงเหตุการณ์ที่จบแล้วในอดีต เหตุการณ์ที่เกิดเรียงลำดับ และนิสัยหรือสภาพในอดีต",
  "topic-past-continuous":
    "ใช้ Past Continuous เพื่อพูดถึงเหตุการณ์ที่กำลังดำเนินอยู่ ณ ช่วงเวลาหนึ่งในอดีต เหตุการณ์ที่ถูกอีกเหตุการณ์แทรก และเหตุการณ์สองอย่างที่กำลังเกิดพร้อมกัน",
  "topic-past-perfect":
    "ใช้ Past Perfect เพื่อแสดงว่าเหตุการณ์หนึ่งเกิดขึ้นและเสร็จสิ้นก่อนอีกเหตุการณ์หนึ่งหรือก่อนช่วงเวลาหนึ่งในอดีต",
  "topic-past-perfect-continuous":
    "ใช้ Past Perfect Continuous เพื่อพูดถึงการกระทำที่ดำเนินต่อเนื่องเป็นระยะเวลาก่อนอีกเหตุการณ์หรือช่วงเวลาหนึ่งในอดีต โดยเน้นระยะเวลาหรือสาเหตุของสภาพในอดีต",
  "topic-future-simple":
    "ใช้ Future Simple ด้วย will สำหรับการตัดสินใจทันที การคาดการณ์ คำสัญญา และการเสนอความช่วยเหลือ แต่ภาษาอังกฤษไม่ได้ใช้ will กับทุกสถานการณ์ในอนาคต",
  "topic-future-continuous":
    "ใช้ Future Continuous เพื่อพูดถึงเหตุการณ์ที่จะกำลังดำเนินอยู่ ณ เวลาหนึ่งในอนาคต เหตุการณ์ที่คาดว่าจะเกิดขึ้นตามปกติ และการถามแผนของผู้อื่นอย่างสุภาพ",
  "topic-future-perfect":
    "ใช้ Future Perfect เพื่อพูดถึงเหตุการณ์ที่จะเสร็จสมบูรณ์ก่อนเวลาหนึ่งหรือก่อนอีกเหตุการณ์หนึ่งในอนาคต",
  "topic-future-perfect-continuous":
    "ใช้ Future Perfect Continuous เพื่อพูดถึงการกระทำที่จะดำเนินต่อเนื่องมาเป็นระยะเวลาหนึ่งจนถึงจุดใดจุดหนึ่งในอนาคต",
};

export function SpeakModePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ConversationCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [showGrammar, setShowGrammar] = useState(() =>
    window.location.hash.includes("view=grammar"),
  );
  const [grammarFilter, setGrammarFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"conversation" | "practice">(
    "conversation",
  );
  const [progress, setProgress] = useState<SpeakModeProgress>(
    getSpeakModeProgress(),
  );
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Data for selected category
  const [lines, setLines] = useState<ConversationLine[]>([]);
  const [vocab, setVocab] = useState<ConversationVocab[]>([]);
  const [practice, setPractice] = useState<ConversationPractice[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchConversationCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  const openGrammar = () => {
    window.location.hash = "speak?view=grammar";
    setShowGrammar(true);
  };
  const closeGrammar = () => {
    window.location.hash = "speak";
    setShowGrammar(false);
  };

  useEffect(() => {
    if (selectedCategoryId) {
      setLoading(true);
      Promise.all([
        fetchConversationLines(selectedCategoryId),
        fetchConversationVocab(selectedCategoryId),
        fetchConversationPractice(selectedCategoryId),
      ]).then(([l, v, p]) => {
        setLines(l);
        setVocab(v);
        setPractice(p);
        setLoading(false);

        // Auto-select first conversation if none selected
        if (!selectedConversationId && l.length > 0) {
          const firstConvId = l[0].conversationId;
          handleSelectConversation(firstConvId);
        }
      });
    }
  }, [selectedCategoryId]);

  const conversationTitles = useMemo(() => {
    const map = new Map<string, string>();
    lines.forEach((line) => {
      if (!map.has(line.conversationId)) {
        map.set(line.conversationId, line.conversationTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [lines]);

  const activeLines = useMemo(() => {
    if (!selectedConversationId) return [];
    return lines
      .filter((l) => l.conversationId === selectedConversationId)
      .sort((a, b) => a.lineNo - b.lineNo);
  }, [lines, selectedConversationId]);

  const activeConversationTitle = useMemo(() => {
    return (
      conversationTitles.find((c) => c.id === selectedConversationId)?.title ||
      "บทสนทนา"
    );
  }, [conversationTitles, selectedConversationId]);

  function handleSelectCategory(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setSelectedConversationId(null);
  }

  function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId);

    // Update progress safely using functional update
    if (selectedCategoryId) {
      setProgress((prev: SpeakModeProgress) => {
        const newProgress = {
          ...prev,
          lastCategoryId: selectedCategoryId,
          lastConversationId: conversationId,
          lastPracticedDate: new Date().toISOString(),
        };
        saveSpeakModeProgress(newProgress);
        return newProgress;
      });
    }
  }

  const recordConversationCompletion = (conversationId: string) => {
    const currentProgress = progressRef.current;
    if (!currentProgress.completedConversations.includes(conversationId)) {
      const newProgress = {
        ...currentProgress,
        completedConversations: [
          ...currentProgress.completedConversations,
          conversationId,
        ],
      };

      saveSpeakModeProgress(newProgress);
      progressRef.current = newProgress;
      setProgress(newProgress);
    }

    recordLearningActivity({
      kind: "conversation_completed",
      mode: "speak",
      entityId: conversationId,
    });
  };

  const handleConversationComplete = () => {
    if (selectedConversationId) {
      const currentIndex = conversationTitles.findIndex(
        (c) => c.id === selectedConversationId,
      );
      if (currentIndex >= 0) {
        if (currentIndex < conversationTitles.length - 1) {
          const nextConvId = conversationTitles[currentIndex + 1].id;
          handleSelectConversation(nextConvId);
        } else {
          setViewMode("practice");
        }
      }
    }
  };

  if (loading && !selectedCategoryId && categories.length === 0) {
    return (
      <PageContainer className="py-8 sm:py-10">
        <div className="flex justify-center p-12">
          <p className="text-ink-secondary">กำลังโหลด...</p>
        </div>
      </PageContainer>
    );
  }

  // 1. View: Category Selection
  if (!selectedCategoryId) {
    if (showGrammar) {
      const topics = getGrammarTopics().filter(
        (t) =>
          grammarFilter === "all" ||
          t.categoryId === grammarFilter ||
          t.stage === grammarFilter,
      );
      return (
        <PageContainer className="py-8 sm:py-10 space-y-8">
          <button
            onClick={closeGrammar}
            className="inline-flex min-h-11 items-center text-sm font-medium text-ink-secondary hover:text-ink-DEFAULT hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg -ml-3 px-3 transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4 shrink-0" />
            กลับไป สนทนา
          </button>
          <header>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-ink-dark tracking-tight">
              Grammar
            </h1>
            <p className="mt-3 text-ink-secondary text-lg">
              12 Tenses · เรียนตามลำดับที่เหมาะกับคุณ
            </p>
          </header>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["all", "present", "past", "future"].map((f) => (
              <button
                key={f}
                onClick={() => setGrammarFilter(f)}
                className={`whitespace-nowrap rounded-full px-4 min-h-10 text-sm font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${grammarFilter === f ? "bg-primary text-white shadow-sm ring-1 ring-primary/50" : "bg-primary-soft text-ink-secondary hover:bg-primary-active"}`}
              >
                {f}
              </button>
            ))}
          </div>
          {topics.length === 0 ? (
            <div className="empty-state max-w-2xl mx-auto my-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft mb-4">
                <BookOpen className="h-8 w-8 text-primary/30" />
              </div>
              <h3 className="text-lg font-bold text-ink-dark">ไม่พบบทเรียน</h3>
              <p className="mt-2 text-ink-secondary">
                ไม่มีบทเรียนที่ตรงกับตัวกรองที่คุณเลือกในขณะนี้
              </p>
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-12">
              {(["present", "past", "future"] as const).map((group) => {
                const items = topics.filter((t) => t.categoryId === group);
                return items.length ? (
                  <section key={group} className="space-y-4">
                    <h2 className="text-xs uppercase tracking-widest font-bold text-ink-secondary ml-1">
                      {group}
                    </h2>
                    <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
                      <div>
                        {items.map((t) => (
                          <article
                            key={t.id}
                            onClick={() => {
                              window.location.hash = `grammar/${t.id}`;
                            }}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 sm:p-5 hover:bg-primary-soft transition-all active:scale-[0.99] cursor-pointer group first:rounded-t-2xl last:rounded-b-2xl"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-ink-dark text-lg group-hover:text-primary transition-colors">
                                  {t.name}
                                </h3>
                                <div className="group/tooltip relative flex items-center">
                                  <div
                                    tabIndex={0}
                                    className="p-2 -m-2 text-ink-secondary/70 sm:hover:text-ink-secondary cursor-help flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                                  >
                                    <Info className="w-4 h-4" />
                                  </div>
                                  <div className="pointer-events-none absolute left-0 top-full mt-2 sm:left-full sm:top-1/2 sm:-translate-y-1/2 sm:mt-0 sm:ml-2 w-[calc(100vw-4rem)] max-w-[280px] sm:w-64 opacity-0 shadow-lg bg-ink-dark text-white text-sm font-medium tracking-wide rounded-lg p-3 transition-all duration-200 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 sm:group-hover/tooltip:ml-3 sm:group-focus-within/tooltip:ml-3 z-[100]">
                                    <div className="hidden sm:block absolute top-1/2 -left-1 -translate-y-1/2 border-[6px] border-transparent border-r-ink-dark"></div>
                                    <div className="block sm:hidden absolute -top-1 left-4 border-[6px] border-transparent border-b-ink-dark"></div>
                                    <p className="font-bold mb-1 text-white">
                                      {t.nameThai}
                                    </p>
                                    <p className="leading-relaxed text-white/80">
                                      {tenseSummaries[t.id]}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-ink-secondary mt-1">
                                {t.nameThai}{" "}
                                <span className="mx-1.5 opacity-40">•</span>{" "}
                                {t.estimatedMinutes} นาที
                              </p>
                            </div>
                            <div className="flex items-center text-ink-secondary/50 group-hover:text-primary transition-colors mt-1 sm:mt-0">
                              <span className="text-sm font-semibold mr-1 sm:hidden">
                                เริ่มเรียน
                              </span>
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : null;
              })}
            </div>
          )}
        </PageContainer>
      );
    }
    return (
      <PageContainer className="py-6 sm:py-8 space-y-5">
        <PageHeader
          subtitle="ฝึกสนทนา"
          title="สนทนา"
          description={
            <>
              ฝึกบทสนทนาภาษาอังกฤษตามสถานการณ์
              <br className="hidden sm:block" />
              เลือกหัวข้อที่สนใจ ฝึกตอบคำถาม และเรียนรู้ประโยคที่นำไปใช้ได้จริง
            </>
          }
          rightContent={
            categories.length > 0 ? (
              <div className="bg-primary-soft border border-primary/20 rounded-2xl px-4 py-3 text-center sm:min-w-28">
                <p className="text-2xl font-black text-ink-dark">{categories.length}</p>
                <p className="text-xs font-bold text-ink-dark uppercase">หัวข้อ</p>
              </div>
            ) : undefined
          }
        />

        {/* Progress Card (If any) */}
        <SpeakProgressCard
          progress={progress}
          categories={categories}
          onResume={handleSelectCategory}
        />

        <section className="pt-2">
          <div
            onClick={openGrammar}
            className="bg-primary-soft/70 rounded-2xl border-2 border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 transition-all duration-200 hover:border-primary/50 hover:bg-primary-soft cursor-pointer group mb-6"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-ink-dark text-lg group-hover:text-primary transition-colors">Grammar</h3>
                  <span className="ui-badge ui-badge-accent text-[10px]">12 Tenses</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-ink-secondary mt-0.5">
                  เรียนไวยากรณ์ภาษาอังกฤษตั้งแต่ Beginner ถึง Intermediate
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <Button
                variant="primary"
                className="w-full sm:w-auto font-bold py-2.5 px-5 rounded-xl transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  openGrammar();
                }}
              >
                เริ่มฝึก Grammar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          <h2 className="mb-3 text-base font-bold text-ink-DEFAULT sm:text-lg">
            เลือกหมวดหมู่ที่ต้องการฝึก
          </h2>
          <CategorySelector
            categories={categories}
            onSelect={handleSelectCategory}
          />
        </section>
      </PageContainer>
    );
  }

  const currentCategory = categories.find((c) => c.id === selectedCategoryId);

  // 2. View: Conversation Practice
    return (
      <PageContainer className="py-6 sm:py-8 space-y-5">
      <div className="mb-2">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className="inline-flex min-h-11 items-center text-sm font-medium text-ink-secondary hover:text-ink-DEFAULT hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg -ml-3 px-3 transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4 shrink-0" />
          กลับไปเลือกหมวดหมู่
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: List & Vocab */}
        <div className="lg:w-1/3 space-y-6">
          <div className="surface-card p-5">
            <h2 className="text-xl font-bold text-ink-dark">
              {currentCategory?.title}
            </h2>
            <p className="text-ink-secondary">{currentCategory?.thaiTitle}</p>
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
          <div className="flex bg-primary-soft p-1 rounded-lg">
            <button
              onClick={() => setViewMode("conversation")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 active:scale-[0.98] ${
                viewMode === "conversation"
                  ? "bg-card text-primary shadow-soft ring-1 ring-border"
                  : "text-ink-secondary hover:text-ink-DEFAULT hover:bg-card/50"
              }`}
            >
              อ่านบทสนทนา
            </button>
            <button
              onClick={() => setViewMode("practice")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 active:scale-[0.98] ${
                viewMode === "practice"
                  ? "bg-card text-primary shadow-soft ring-1 ring-border"
                  : "text-ink-secondary hover:text-ink-DEFAULT hover:bg-card/50"
              }`}
            >
              ฝึกตอบคำถาม (Practice)
            </button>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="surface-card w-full h-full flex items-center justify-center min-h-[400px]">
                <p className="text-ink-secondary">กำลังโหลดข้อมูล...</p>
              </div>
            ) : viewMode === "practice" ? (
              <InteractivePracticePlayer
                categoryTitle={currentCategory?.title || ""}
                questions={practice}
                onComplete={handleConversationComplete}
              />
            ) : selectedConversationId && activeLines.length > 0 ? (
              <ConversationPlayer
                title={activeConversationTitle}
                lines={activeLines}
                onReachedLastLine={() =>
                  recordConversationCompletion(selectedConversationId)
                }
                onComplete={handleConversationComplete}
              />
            ) : (
              <div className="surface-card w-full h-full flex flex-col items-center justify-center text-center p-6 min-h-[400px]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft mb-4">
                  <MessageSquareOff className="h-8 w-8 text-primary/30" />
                </div>
                <h3 className="text-lg font-bold text-ink-dark">
                  ไม่พบข้อมูลบทสนทนา
                </h3>
                <p className="mt-2 text-ink-secondary">
                  ลองเลือกหมวดหมู่ใหม่ หรือรอการอัปเดตเร็วๆ นี้นะครับ
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile-only Vocab */}
        <div className="lg:hidden space-y-6 w-full">
          <VocabularyPanel vocabList={vocab} />
        </div>
      </div>
    </PageContainer>
  );
}
