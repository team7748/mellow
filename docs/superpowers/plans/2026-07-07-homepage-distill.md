# HomePage Distill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Home page into a calm, Thai-first study launcher instead of a full progress dashboard.

**Architecture:** Keep this as a focused `HomePage.tsx` refactor. The page will consume existing vocabulary/progress utilities for a compact summary, keep existing navigation callbacks, and stop rendering `ProgressDashboard` and `FeatureCard` on Home. Tests in `src/App.test.tsx` define the new Home contract and preserve navigation behavior.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Vitest, Testing Library, lucide-react.

## Global Constraints

- Do not redesign Flashcard mode in this pass.
- Do not redesign Vocabulary cards in this pass.
- Do not add a new route for progress settings.
- Do not change the progress calculation or storage model.
- Do not add new dependencies.
- Do not introduce heavy animation or decorative visuals.
- Use Thai-first operational copy.
- Keep English visible where it names the learning content or mode.
- Preserve mobile-first readability and large touch targets.

---

## File Structure

- Modify `src/App.test.tsx`: replace the old Home dashboard test with launcher-focused assertions and keep navigation tests.
- Modify `src/pages/HomePage.tsx`: remove dashboard/feature-card imports, add compact progress summary, write the new launcher layout, and keep `onOpenVocabulary` / `onStartFlashcard` callbacks.

No new source files are required. The existing `ProgressDashboard` remains in the codebase for later placement, but Home will not render it.

---

### Task 1: Update HomePage Tests for Study Launcher Contract

**Files:**
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `App` renders `HomePage` by default.
- Produces: test expectations that Task 2 must satisfy:
  - Home has heading `วันนี้เริ่มฝึกคำศัพท์ต่อได้ทันที`
  - Home has primary button `เริ่มฝึก Flashcard`
  - Home has secondary button `ดูคลังคำศัพท์`
  - Home shows compact labels `คำศัพท์ทั้งหมด` and `ความคืบหน้า`
  - Home does not show `Export progress`, `Import progress`, or `Reset progress`

- [ ] **Step 1: Replace the old dashboard test with launcher assertions**

In `src/App.test.tsx`, replace the test named `shows the progress dashboard on the home page` with:

```tsx
it("shows a focused study launcher on the home page", () => {
  render(<App />)

  expect(
    screen.getByRole("heading", {
      name: "วันนี้เริ่มฝึกคำศัพท์ต่อได้ทันที",
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "เริ่มฝึก Flashcard" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "ดูคลังคำศัพท์" }),
  ).toBeInTheDocument()
  expect(screen.getByText("คำศัพท์ทั้งหมด")).toBeInTheDocument()
  expect(screen.getByText("ความคืบหน้า")).toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: "Export progress" }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: "Import progress" }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: "Reset progress" }),
  ).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Update the secondary action navigation label expectation**

In the existing home primary action test, keep the `เริ่มฝึก Flashcard` assertion unchanged.

Add this test after it:

```tsx
it("opens vocabulary from the home secondary action", async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getByRole("button", { name: "ดูคลังคำศัพท์" }))

  expect(screen.getByRole("heading", { name: "คลังคำศัพท์" })).toBeInTheDocument()
})
```

- [ ] **Step 3: Run the focused test and verify it fails for the right reason**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because the old Home page does not render the new heading `วันนี้เริ่มฝึกคำศัพท์ต่อได้ทันที`, and the old secondary action is still labeled `ดูรายการคำศัพท์`.

---

### Task 2: Refactor HomePage into a Calm Study Launcher

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Interfaces:**
- Consumes:
  - `onOpenVocabulary?: () => void`
  - `onStartFlashcard?: () => void`
  - `getAllVocabulary(): VocabularyItem[]`
  - `calculateProgressStats(): ProgressStats`
- Produces:
  - Home UI matching Task 1 tests
  - Compact summary without progress management actions
  - Existing navigation callbacks still connected

- [ ] **Step 1: Replace imports**

Change the imports at the top of `src/pages/HomePage.tsx` to:

```tsx
import { ArrowRight, BookOpen, CheckCircle2, Layers3 } from "lucide-react"
import { Container } from "../components/layout/Container"
import { Button } from "../components/ui/Button"
import { calculateProgressStats } from "../utils/vocabulary"
import { getAllVocabulary } from "../utils/vocabulary"
```

- [ ] **Step 2: Replace `features` with a study path**

Replace the `features` constant with:

```tsx
const studyPath = [
  "ฟังเสียงและอ่านคำศัพท์ให้ชัด",
  "พลิกการ์ดเพื่อดูความหมายและตัวอย่าง",
  "เลือกว่าจำได้หรือควรทบทวนอีกครั้ง",
]
```

- [ ] **Step 3: Add compact summary values inside `HomePage`**

At the start of `HomePage`, before `return`, add:

```tsx
const stats = calculateProgressStats()
const totalWords = getAllVocabulary().length
const progressPercentage =
  stats.totalWords > 0
    ? Math.round((stats.masteredWords / stats.totalWords) * 100)
    : 0
```

Use `totalWords` for the displayed total vocabulary count, and `progressPercentage` for the compact progress label and progress bar.

- [ ] **Step 4: Replace the returned JSX**

Replace the current `return` body with:

```tsx
return (
  <Container className="py-6 sm:py-10">
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
      <div className="py-2 sm:py-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-leaf ring-1 ring-emerald-100">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          เรียนสั้น ๆ ได้ทุกวัน
        </div>
        <h1 className="mt-5 max-w-2xl break-words text-3xl font-bold leading-tight text-ink sm:text-4xl">
          วันนี้เริ่มฝึกคำศัพท์ต่อได้ทันที
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          เปิดแอปแล้วเริ่มจากชุดคำสั้น ๆ ฟังเสียง ดูคำแปลไทย และทบทวนคำที่ยังไม่มั่นใจโดยไม่ต้องจัดการอะไรเพิ่ม
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button className="w-full sm:w-auto" onClick={onStartFlashcard}>
            <Layers3 aria-hidden="true" className="mr-2 h-5 w-5" />
            เริ่มฝึก Flashcard
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant="secondary"
            onClick={onOpenVocabulary}
          >
            <BookOpen aria-hidden="true" className="mr-2 h-5 w-5" />
            ดูคลังคำศัพท์
          </Button>
        </div>
      </div>

      <aside className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <p className="text-sm font-semibold text-slate-600">
          ภาพรวมการเรียน
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-bold text-ink">{totalWords}</p>
            <p className="mt-1 text-sm text-slate-600">คำศัพท์ทั้งหมด</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-leaf">{progressPercentage}%</p>
            <p className="mt-1 text-sm text-slate-600">ความคืบหน้า</p>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            aria-label={`ความคืบหน้า ${progressPercentage}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progressPercentage}
            className="h-full rounded-full bg-leaf"
            role="progressbar"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          เริ่มจาก Flashcard เพื่อให้คำศัพท์เด่นทีละคำ แล้วค่อยกลับมาดูคลังคำเมื่อต้องการค้นหา
        </p>
      </aside>
    </section>

    <section className="mt-8 rounded-lg bg-slate-50 p-5 ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">เส้นทางเรียนวันนี้</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            ทำทีละขั้นสั้น ๆ แล้วจบ session ได้โดยไม่กดดัน
          </p>
        </div>
        <ArrowRight aria-hidden="true" className="hidden h-5 w-5 text-leaf sm:block" />
      </div>
      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {studyPath.map((item, index) => (
          <li
            key={item}
            className="flex gap-3 rounded-lg bg-white p-4 ring-1 ring-slate-200"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-leaf">
              {index + 1}
            </span>
            <span className="text-sm font-medium leading-6 text-slate-700">
              {item}
            </span>
          </li>
        ))}
      </ol>
    </section>
  </Container>
)
```

- [ ] **Step 5: Run focused tests and verify pass**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS for App home/navigation tests.

---

### Task 3: Verify Full App Quality

**Files:**
- No source edits expected unless verification exposes a regression.

**Interfaces:**
- Consumes: completed Tasks 1-2.
- Produces: verified build/test status.

- [ ] **Step 1: Run the full test suite**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: TypeScript build and Vite build succeed. If sandboxed Vite fails with `spawn EPERM`, rerun the same command with approved escalation and record that reason.

- [ ] **Step 3: Run the Impeccable detector on touched UI files**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/pages/HomePage.tsx src/App.test.tsx
```

Expected: no new high-severity findings. Font warnings in `index.html` are outside this touched-file scan.

---

## Self-Review

Spec coverage:

- Study launcher: Task 2 Step 4.
- One primary action and secondary vocabulary action: Task 1 assertions and Task 2 Step 4.
- Compact progress summary: Task 2 Steps 3-4.
- Remove full dashboard/import/export/reset from Home: Task 1 negative assertions and Task 2 Step 4.
- Thai-first copy: Task 2 Step 4.
- Mobile-readable large touch targets: preserved through existing `Button` and responsive layout in Task 2 Step 4.
- Existing navigation works: Task 1 Step 2 and existing tests.
- Build verification: Task 3 Step 2.

Placeholder scan: no TBD/TODO placeholders.

Type consistency: all imported functions exist in the current codebase, and callbacks match current `HomePageProps`.
