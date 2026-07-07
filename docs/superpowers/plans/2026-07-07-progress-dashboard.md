# Progress Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Home / "สรุปผล" page into a real progress dashboard with live vocabulary stats plus reset, export, and import progress actions.

**Architecture:** Keep progress persistence in `src/lib/storage.ts`, where LocalStorage already lives. Add a focused `ProgressDashboard` component that reads stats through `calculateProgressStats()` and invokes storage helpers for reset/export/import. Keep `HomePage` as the route-level composition layer and avoid adding a new route.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, jsdom, Tailwind CSS, lucide-react.

## Global Constraints

- Use the current Home page as the dashboard.
- Use the actual vocabulary dataset through `calculateProgressStats()`; do not hard-code the total word count.
- Progress percentage is `masteredWords / totalWords * 100`, rounded to a whole number.
- If `totalWords` is `0`, progress percentage is `0%`.
- Reset removes saved progress from LocalStorage through the existing storage layer.
- Export downloads the current `UserProgress` JSON with filename `vocabulary-progress.json`.
- Import must parse and validate JSON before saving; invalid files must not overwrite current progress.
- No backend sync, user accounts, analytics charts, detailed date history, or new navigation route.
- Use TDD: every production change starts with a failing test.

---

## File Structure

- Modify `src/lib/storage.ts`: keep the existing `loadProgress()`, `saveProgress()`, and `clearProgress()` APIs; add import/export helpers and validation.
- Create `src/lib/storage.test.ts`: unit tests for progress import/export validation and save behavior.
- Create `src/components/progress/ProgressDashboard.tsx`: dashboard UI and user interactions.
- Create `src/components/progress/ProgressDashboard.test.tsx`: component tests for counts, percent, reset, valid import, invalid import, and export.
- Modify `src/pages/HomePage.tsx`: remove hard-coded stats and render `ProgressDashboard`.
- Modify `src/App.test.tsx`: update Home expectations from landing stats to dashboard stats.

---

### Task 1: Progress Import/Export Storage Helpers

**Files:**
- Modify: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

**Interfaces:**
- Consumes: existing `UserProgress`, `WordProgress`, `WordStatus` types from `src/types/vocabulary.ts`
- Produces:
  - `PROGRESS_EXPORT_FILENAME = "vocabulary-progress.json"`
  - `serializeProgress(progress?: UserProgress): string`
  - `parseProgressImport(rawValue: string): ProgressImportResult`
  - `importProgress(rawValue: string): ProgressImportResult`
  - `type ProgressImportResult = { ok: true; progress: UserProgress } | { ok: false; error: string }`

- [ ] **Step 1: Write failing storage helper tests**

Create `src/lib/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest"
import type { UserProgress } from "../types/vocabulary"
import {
  importProgress,
  loadProgress,
  parseProgressImport,
  PROGRESS_EXPORT_FILENAME,
  serializeProgress,
} from "./storage"

describe("progress storage import/export helpers", () => {
  const validProgress: UserProgress = {
    learnedWordIds: ["word_001"],
    words: {
      word_001: {
        wordId: "word_001",
        status: "mastered",
        correctCount: 4,
        wrongCount: 1,
        lastStudiedAt: "2026-07-07T08:00:00.000Z",
        nextReviewAt: "2026-07-21T08:00:00.000Z",
      },
    },
    updatedAt: "2026-07-07T08:00:00.000Z",
  }

  beforeEach(() => {
    localStorage.clear()
  })

  it("uses the expected export filename", () => {
    expect(PROGRESS_EXPORT_FILENAME).toBe("vocabulary-progress.json")
  })

  it("serializes progress as readable JSON", () => {
    expect(serializeProgress(validProgress)).toBe(
      JSON.stringify(validProgress, null, 2),
    )
  })

  it("parses a valid imported progress object", () => {
    const result = parseProgressImport(JSON.stringify(validProgress))

    expect(result).toEqual({
      ok: true,
      progress: validProgress,
    })
  })

  it("rejects invalid JSON without returning progress", () => {
    expect(parseProgressImport("{bad json")).toEqual({
      ok: false,
      error: "ไฟล์ progress ไม่ใช่ JSON ที่อ่านได้",
    })
  })

  it("rejects malformed progress without saving", () => {
    const result = importProgress(
      JSON.stringify({
        learnedWordIds: "word_001",
        words: [],
        updatedAt: false,
      }),
    )

    expect(result).toEqual({
      ok: false,
      error: "รูปแบบไฟล์ progress ไม่ถูกต้อง",
    })
    expect(loadProgress()).toMatchObject({
      learnedWordIds: [],
      words: {},
      updatedAt: null,
    })
  })

  it("saves valid imported progress", () => {
    expect(importProgress(JSON.stringify(validProgress))).toEqual({
      ok: true,
      progress: validProgress,
    })
    expect(loadProgress()).toEqual(validProgress)
  })
})
```

- [ ] **Step 2: Run storage tests to verify they fail**

Run:

```bash
npm test -- src/lib/storage.test.ts
```

Expected: FAIL because `PROGRESS_EXPORT_FILENAME`, `serializeProgress`, `parseProgressImport`, and `importProgress` do not exist.

- [ ] **Step 3: Implement minimal storage helpers**

Modify `src/lib/storage.ts`:

```ts
import type { UserProgress, WordProgress, WordStatus } from "../types/vocabulary"

export const PROGRESS_STORAGE_KEY = "thai-english-vocab-progress"
export const PROGRESS_EXPORT_FILENAME = "vocabulary-progress.json"

export type ProgressImportResult =
  | { ok: true; progress: UserProgress }
  | { ok: false; error: string }

const wordStatuses: WordStatus[] = ["new", "learning", "review", "mastered"]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isWordProgress(value: unknown): value is WordProgress {
  if (!isRecord(value)) return false

  return (
    typeof value.wordId === "string" &&
    wordStatuses.includes(value.status as WordStatus) &&
    typeof value.correctCount === "number" &&
    Number.isFinite(value.correctCount) &&
    typeof value.wrongCount === "number" &&
    Number.isFinite(value.wrongCount) &&
    isNullableString(value.lastStudiedAt) &&
    isNullableString(value.nextReviewAt)
  )
}

function isUserProgress(value: unknown): value is UserProgress {
  if (!isRecord(value)) return false
  if (!Array.isArray(value.learnedWordIds)) return false
  if (!value.learnedWordIds.every((wordId) => typeof wordId === "string")) {
    return false
  }
  if (!isRecord(value.words)) return false
  if (!Object.values(value.words).every(isWordProgress)) return false

  return isNullableString(value.updatedAt)
}

export function createEmptyProgress(): UserProgress {
  return {
    learnedWordIds: [],
    words: {},
    updatedAt: null,
  }
}

export function loadProgress(): UserProgress {
  const rawValue = localStorage.getItem(PROGRESS_STORAGE_KEY)

  if (!rawValue) {
    return createEmptyProgress()
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<UserProgress>

    return {
      learnedWordIds: Array.isArray(parsed.learnedWordIds)
        ? parsed.learnedWordIds
        : [],
      words: parsed.words && typeof parsed.words === "object" ? parsed.words : {},
      updatedAt: parsed.updatedAt ?? null,
    }
  } catch {
    return createEmptyProgress()
  }
}

export function saveProgress(progress: UserProgress) {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
}

export function clearProgress() {
  localStorage.removeItem(PROGRESS_STORAGE_KEY)
}

export function serializeProgress(progress = loadProgress()) {
  return JSON.stringify(progress, null, 2)
}

export function parseProgressImport(rawValue: string): ProgressImportResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawValue)
  } catch {
    return {
      ok: false,
      error: "ไฟล์ progress ไม่ใช่ JSON ที่อ่านได้",
    }
  }

  if (!isUserProgress(parsed)) {
    return {
      ok: false,
      error: "รูปแบบไฟล์ progress ไม่ถูกต้อง",
    }
  }

  return {
    ok: true,
    progress: parsed,
  }
}

export function importProgress(rawValue: string): ProgressImportResult {
  const result = parseProgressImport(rawValue)

  if (!result.ok) {
    return result
  }

  saveProgress(result.progress)

  return result
}
```

- [ ] **Step 4: Run storage tests to verify they pass**

Run:

```bash
npm test -- src/lib/storage.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit storage helpers**

Run:

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: add progress import export helpers"
```

---

### Task 2: Progress Dashboard Component

**Files:**
- Create: `src/components/progress/ProgressDashboard.tsx`
- Test: `src/components/progress/ProgressDashboard.test.tsx`

**Interfaces:**
- Consumes:
  - `calculateProgressStats(now?: Date): ProgressStats` from `src/utils/vocabulary.ts`
  - `resetProgress()` from `src/utils/vocabulary.ts`
  - `loadProgress()`, `serializeProgress()`, `importProgress()`, `PROGRESS_EXPORT_FILENAME` from `src/lib/storage.ts`
- Produces:
  - `export function calculateProgressPercentage(totalWords: number, masteredWords: number): number`
  - `export function ProgressDashboard(): JSX.Element`

- [ ] **Step 1: Write failing component tests**

Create `src/components/progress/ProgressDashboard.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UserProgress } from "../../types/vocabulary"
import { updateWordProgress } from "../../utils/vocabulary"
import {
  PROGRESS_EXPORT_FILENAME,
  PROGRESS_STORAGE_KEY,
  saveProgress,
} from "../../lib/storage"
import {
  calculateProgressPercentage,
  ProgressDashboard,
} from "./ProgressDashboard"

describe("calculateProgressPercentage", () => {
  it("returns 0 when there are no words", () => {
    expect(calculateProgressPercentage(0, 0)).toBe(0)
  })

  it("rounds mastered words over total words to a whole percent", () => {
    expect(calculateProgressPercentage(60, 4)).toBe(7)
  })
})

describe("ProgressDashboard", () => {
  const validImportProgress: UserProgress = {
    learnedWordIds: ["word_001"],
    words: {
      word_001: {
        wordId: "word_001",
        status: "mastered",
        correctCount: 4,
        wrongCount: 0,
        lastStudiedAt: "2026-07-07T08:00:00.000Z",
        nextReviewAt: "2026-07-21T08:00:00.000Z",
      },
    },
    updatedAt: "2026-07-07T08:00:00.000Z",
  }

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("renders dashboard counts from real vocabulary progress", () => {
    const answeredAt = new Date("2026-07-07T08:00:00.000Z")
    updateWordProgress("word_001", true, answeredAt)
    updateWordProgress("word_002", false, answeredAt)
    updateWordProgress("word_003", true, answeredAt)
    updateWordProgress("word_003", true, answeredAt)
    updateWordProgress("word_004", true, answeredAt)
    updateWordProgress("word_004", true, answeredAt)
    updateWordProgress("word_004", true, answeredAt)
    updateWordProgress("word_004", true, answeredAt)

    render(<ProgressDashboard />)

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByText("60")).toBeInTheDocument()
    expect(screen.getByText("56")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2%")).toBeInTheDocument()
  })

  it("resets progress and refreshes counts", async () => {
    const user = userEvent.setup()
    updateWordProgress("word_001", true, new Date("2026-07-07T08:00:00.000Z"))

    render(<ProgressDashboard />)

    await user.click(screen.getByRole("button", { name: "Reset progress" }))

    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull()
    expect(screen.getByText("รีเซ็ต progress แล้ว")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("exports the current progress as a JSON download", async () => {
    const user = userEvent.setup()
    const clickMock = vi.fn()
    const createElement = vi.spyOn(document, "createElement")
    const createObjectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:progress")
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})

    createElement.mockImplementation((tagName: string) => {
      const element = document.createElementNS("http://www.w3.org/1999/xhtml", tagName)

      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          configurable: true,
          value: clickMock,
        })
      }

      return element as HTMLElement
    })

    saveProgress(validImportProgress)
    render(<ProgressDashboard />)

    await user.click(screen.getByRole("button", { name: "Export progress" }))

    const anchor = createElement.mock.results.find(
      (result) => (result.value as HTMLElement).tagName === "A",
    )?.value as HTMLAnchorElement

    expect(anchor.download).toBe(PROGRESS_EXPORT_FILENAME)
    expect(anchor.href).toBe("blob:progress")
    expect(clickMock).toHaveBeenCalledTimes(1)
    expect(createObjectUrl).toHaveBeenCalledTimes(1)
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:progress")
  })

  it("imports valid progress and refreshes dashboard counts", async () => {
    const user = userEvent.setup()
    render(<ProgressDashboard />)

    const file = new File([JSON.stringify(validImportProgress)], "progress.json", {
      type: "application/json",
    })

    await user.upload(screen.getByLabelText("Import progress"), file)

    await waitFor(() => {
      expect(screen.getByText("นำเข้า progress แล้ว")).toBeInTheDocument()
    })
    expect(screen.getByText("2%")).toBeInTheDocument()
  })

  it("rejects invalid import files without overwriting progress", async () => {
    const user = userEvent.setup()
    saveProgress(validImportProgress)

    render(<ProgressDashboard />)

    const file = new File(["{bad json"], "broken.json", {
      type: "application/json",
    })

    await user.upload(screen.getByLabelText("Import progress"), file)

    await waitFor(() => {
      expect(
        screen.getByText("ไฟล์ progress ไม่ใช่ JSON ที่อ่านได้"),
      ).toBeInTheDocument()
    })
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBe(
      JSON.stringify(validImportProgress),
    )
  })
})
```

- [ ] **Step 2: Run component tests to verify they fail**

Run:

```bash
npm test -- src/components/progress/ProgressDashboard.test.tsx
```

Expected: FAIL because `ProgressDashboard.tsx` does not exist.

- [ ] **Step 3: Implement minimal dashboard component**

Create `src/components/progress/ProgressDashboard.tsx`:

```tsx
import { ChangeEvent, useRef, useState } from "react"
import { Download, RotateCcw, Upload } from "lucide-react"
import { Button } from "../ui/Button"
import { StatCard } from "../ui/StatCard"
import {
  importProgress,
  PROGRESS_EXPORT_FILENAME,
  serializeProgress,
} from "../../lib/storage"
import type { ProgressStats } from "../../types/vocabulary"
import { calculateProgressStats, resetProgress } from "../../utils/vocabulary"

type Notice = {
  tone: "success" | "error"
  message: string
}

const statCards = [
  {
    key: "totalWords",
    label: "คำศัพท์ทั้งหมด",
    hint: "จากไฟล์ข้อมูลจริง",
  },
  {
    key: "newWords",
    label: "ยังไม่เรียน",
    hint: "ยังไม่มี progress",
  },
  {
    key: "learningWords",
    label: "กำลังเรียน",
    hint: "เริ่มฝึกแล้ว",
  },
  {
    key: "dueReviewWords",
    label: "ต้องทบทวน",
    hint: "ถึงรอบฝึกซ้ำ",
  },
  {
    key: "masteredWords",
    label: "Mastered",
    hint: "จำได้มั่นใจขึ้น",
  },
] satisfies Array<{
  key: keyof ProgressStats
  label: string
  hint: string
}>

export function calculateProgressPercentage(totalWords: number, masteredWords: number) {
  if (totalWords <= 0) {
    return 0
  }

  return Math.round((masteredWords / totalWords) * 100)
}

export function ProgressDashboard() {
  const [stats, setStats] = useState(() => calculateProgressStats())
  const [notice, setNotice] = useState<Notice | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const progressPercentage = calculateProgressPercentage(
    stats.totalWords,
    stats.masteredWords,
  )

  function refreshStats() {
    setStats(calculateProgressStats())
  }

  function handleResetProgress() {
    resetProgress()
    refreshStats()
    setNotice({
      tone: "success",
      message: "รีเซ็ต progress แล้ว",
    })
  }

  function handleExportProgress() {
    const progressJson = serializeProgress()
    const blob = new Blob([progressJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = PROGRESS_EXPORT_FILENAME
    link.click()
    URL.revokeObjectURL(url)
    setNotice({
      tone: "success",
      message: "Export progress แล้ว",
    })
  }

  async function handleImportProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      const result = importProgress(await file.text())

      if (!result.ok) {
        setNotice({
          tone: "error",
          message: result.error,
        })
        return
      }

      refreshStats()
      setNotice({
        tone: "success",
        message: "นำเข้า progress แล้ว",
      })
    } catch {
      setNotice({
        tone: "error",
        message: "อ่านไฟล์ progress ไม่สำเร็จ",
      })
    } finally {
      event.target.value = ""
    }
  }

  return (
    <section aria-labelledby="dashboard-heading" className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-leaf">
              Progress Dashboard
            </p>
            <h1 id="dashboard-heading" className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-700">
              สรุปความคืบหน้าจากคำศัพท์จริงและ progress ที่บันทึกไว้ในเครื่องนี้
            </p>
          </div>
          <div className="min-w-36 rounded-lg bg-emerald-50 px-5 py-4 text-center ring-1 ring-emerald-100">
            <p className="text-4xl font-bold text-leaf">{progressPercentage}%</p>
            <p className="mt-1 text-sm font-medium text-slate-600">ความคืบหน้า</p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            aria-label={`ความคืบหน้า ${progressPercentage}%`}
            className="h-full rounded-full bg-leaf transition-all"
            role="progressbar"
            style={{ width: `${progressPercentage}%` }}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercentage}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={String(stats[card.key])}
            hint={card.hint}
          />
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            className="bg-white text-leaf ring-1 ring-slate-200 hover:bg-emerald-50"
            onClick={handleExportProgress}
          >
            <Download aria-hidden="true" className="mr-2 h-4 w-4" />
            Export progress
          </Button>
          <Button
            className="bg-white text-leaf ring-1 ring-slate-200 hover:bg-emerald-50"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
            Import progress
          </Button>
          <input
            ref={importInputRef}
            aria-label="Import progress"
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={handleImportProgress}
          />
          <Button
            className="bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
            onClick={handleResetProgress}
          >
            <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />
            Reset progress
          </Button>
        </div>

        {notice ? (
          <p
            className={`mt-3 text-sm font-medium ${
              notice.tone === "error" ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {notice.message}
          </p>
        ) : null}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run component tests to verify they pass**

Run:

```bash
npm test -- src/components/progress/ProgressDashboard.test.tsx
```

Expected: PASS. If the export test recurses because of the `document.createElement` spy, replace `document.createElementNS` in the test setup with `document.createElement.bind(document)` saved before the spy.

- [ ] **Step 5: Commit dashboard component**

Run:

```bash
git add src/components/progress/ProgressDashboard.tsx src/components/progress/ProgressDashboard.test.tsx
git commit -m "feat: add progress dashboard"
```

---

### Task 3: Home Page Integration

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes:
  - `ProgressDashboard` from `src/components/progress/ProgressDashboard.tsx`
  - existing `onOpenVocabulary?: () => void` prop
- Produces:
  - Home page renders the dashboard on the existing `home` route
  - Existing navigation to vocabulary, flashcard, and quiz still works

- [ ] **Step 1: Write failing Home/App tests**

Modify the first test in `src/App.test.tsx`:

```tsx
it("shows the progress dashboard on the home page", () => {
  render(<App />)

  expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
  expect(screen.getByText("คำศัพท์ทั้งหมด")).toBeInTheDocument()
  expect(screen.getByText("ยังไม่เรียน")).toBeInTheDocument()
  expect(screen.getByText("กำลังเรียน")).toBeInTheDocument()
  expect(screen.getByText("ต้องทบทวน")).toBeInTheDocument()
  expect(screen.getByText("Mastered")).toBeInTheDocument()
  expect(screen.getByText("0%")).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "Export progress" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "Import progress" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "Reset progress" }),
  ).toBeInTheDocument()
})
```

Keep the existing flashcard and quiz navigation tests unchanged.

- [ ] **Step 2: Run App test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because `HomePage` still renders the old landing content and hard-coded stats.

- [ ] **Step 3: Replace Home hard-coded stats with dashboard**

Modify `src/pages/HomePage.tsx`:

```tsx
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
```

- [ ] **Step 4: Run App test to verify it passes**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit Home integration**

Run:

```bash
git add src/pages/HomePage.tsx src/App.test.tsx
git commit -m "feat: show dashboard on home page"
```

---

### Task 4: Full Verification and Documentation Touch-Up

**Files:**
- Modify: `docs/FEATURES.md`
- Modify: `docs/UI_GUIDE.md` only if implementation introduces UI behavior not already described there

**Interfaces:**
- Consumes: completed dashboard behavior from Tasks 1-3
- Produces: verified build/test state and docs aligned with the feature

- [ ] **Step 1: Write failing documentation check by inspection**

Open `docs/FEATURES.md` and confirm the Progress Dashboard section does not yet mention:

```md
- progress percentage
- reset progress
- export/import progress
```

Expected: the current section only lists the core counts, so documentation is incomplete.

- [ ] **Step 2: Update Progress Dashboard docs**

Modify the `## Progress Dashboard` section in `docs/FEATURES.md`:

```md
## Progress Dashboard

หน้า “สรุปผล” แสดงภาพรวมความคืบหน้าจากข้อมูลคำศัพท์จริงและ LocalStorage progress:

- จำนวนคำทั้งหมดจาก `src/data/vocabulary.json`
- จำนวนคำใหม่ / ยังไม่เรียน
- จำนวนคำที่กำลังเรียน
- จำนวนคำที่ถึงรอบทบทวน
- จำนวนคำที่ mastered
- เปอร์เซ็นต์ความคืบหน้าจาก `masteredWords / totalWords`
- ปุ่ม reset progress เพื่อล้างข้อมูลในเครื่อง
- ปุ่ม export/import progress สำหรับสำรองและกู้คืนไฟล์ JSON
```

- [ ] **Step 3: Run focused tests**

Run:

```bash
npm test -- src/lib/storage.test.ts src/components/progress/ProgressDashboard.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Run all tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Run production build**

Run:

```bash
npm run build
```

Expected: PASS with TypeScript and Vite build completed.

- [ ] **Step 6: Commit verification/docs**

Run:

```bash
git add docs/FEATURES.md
git commit -m "docs: document progress dashboard"
```

If `docs/FEATURES.md` is already modified by user work unrelated to this feature, do not overwrite it. Instead, inspect the diff and only stage the Progress Dashboard section.

---

## Self-Review

Spec coverage:

- Total vocabulary count from real file: Task 2 renders `stats.totalWords` from `calculateProgressStats()`.
- Not learned, learning, review, mastered counts: Task 2 stat card mapping covers `newWords`, `learningWords`, `dueReviewWords`, and `masteredWords`.
- Progress percentage: Task 2 adds and tests `calculateProgressPercentage()`.
- Reset: Task 2 adds and tests `handleResetProgress()`.
- Export/import: Task 1 adds storage helpers; Task 2 adds UI actions and tests.
- Existing page: Task 3 integrates into `HomePage`; no new route.
- Invalid import protection: Task 1 and Task 2 reject malformed imports without saving.
- Docs: Task 4 updates `docs/FEATURES.md`.

Placeholder scan:

- No placeholder markers or vague behavior remain.
- Every test and production step includes concrete code or exact commands.

Type consistency:

- `ProgressImportResult`, `serializeProgress`, `parseProgressImport`, `importProgress`, `PROGRESS_EXPORT_FILENAME`, `calculateProgressPercentage`, and `ProgressDashboard` are defined before later tasks use them.
- `ProgressStats` property names match `src/types/vocabulary.ts`.
