import { BookOpen, Layers3 } from "lucide-react"
import { Container } from "../components/layout/Container"
import { ProgressDashboard } from "../components/progress/ProgressDashboard"
import { Button } from "../components/ui/Button"
import { FeatureCard } from "../components/ui/FeatureCard"

const features = [
  {
    title: "Flashcard",
    description: "ฝึกจำทีละคำ เห็นคำอ่าน คำแปล และตัวอย่างก่อนทบทวนซ้ำ",
    icon: Layers3,
  },
  {
    title: "Vocabulary",
    description: "ค้นหาและกรองคำศัพท์ทั้งหมด พร้อมดูสถานะการเรียนของแต่ละคำ",
    icon: BookOpen,
  },
]

type HomePageProps = {
  onOpenVocabulary?: () => void
}

export function HomePage({ onOpenVocabulary }: HomePageProps) {
  return (
    <Container className="py-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-leaf">
            English vocabulary for Thai learners
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink">
            สรุปผลการเรียนคำศัพท์
          </h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button>เริ่มเรียน</Button>
          <Button
            className="bg-white text-leaf ring-1 ring-slate-200 hover:bg-emerald-50"
            onClick={onOpenVocabulary}
          >
            ดูรายการคำศัพท์
          </Button>
        </div>
      </div>

      <ProgressDashboard />

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>
    </Container>
  )
}
