# Home Page Reference Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปรับหน้า Home ให้ใกล้เคียงภาพอ้างอิงทั้ง Desktop และ Mobile โดยใช้เฉพาะข้อมูลจริง รูปที่ผู้ใช้ให้ และ action/route เดิม

**Architecture:** คง `AppLayout`, `Sidebar` และ `MobileNav` เป็นโครงนำทางเดิม แล้วปรับ composition ภายใน `HomePage`. เพิ่มจำนวนคำที่เรียนจริงและตัวเลือก Quick review แบบ read-only ใน `homeProgress`; ไม่ render Daily goal, Day streak และ Today’s missions เพราะไม่มีระบบข้อมูลจริงรองรับ

**Tech Stack:** React 19, TypeScript 5.7, Tailwind CSS 3.4, Vitest, Testing Library, Vite

## Global Constraints

- ห้ามเปลี่ยน business logic, state, LocalStorage, Supabase, API, routing หรือระบบตรวจคำตอบ
- ห้ามเพิ่ม dependency, ปุ่ม, route หรือระบบ progress/mission/streak/goal ใหม่
- ทุกตัวเลข สถานะ และ progress ต้องมาจาก utility หรือ storage เดิม
- รูปทั้งหมดใช้ `object-fit: contain` และต้องไม่ถูกตัด
- ใช้ token สีจาก `DESIGN.md`; card radius 12–16px
- รองรับ viewport ตั้งแต่ 320px และห้ามเกิด horizontal page overflow
- รักษาไฟล์ที่ผู้ใช้แก้ไว้ทั้งหมดและ commit เฉพาะไฟล์ในแต่ละ task

## File Map

- Modify: `src/utils/homeProgress.ts` — expose real learned count and select one real review word
- Modify: `src/utils/homeProgress.test.ts` — verify real Home data and empty states
- Create: `src/pages/HomePage.test.tsx` — verify conditional UI and original actions
- Modify: `src/pages/HomePage.tsx` — implement the reference composition
- Modify: `src/styles.css` — Home-specific responsive and overflow rules only
- Create: `src/assets/images/home-sloth-reference.png`
- Create: `src/assets/images/continue-learning-reference.png`
- Create: `src/assets/images/stat-words-learned.png`
- Create: `src/assets/images/home-leaf-accent.png`

---

### Task 1: Derive Only Real Home Data

**Files:**
- Modify: `src/utils/homeProgress.ts`
- Modify: `src/utils/homeProgress.test.ts`

**Interfaces:**
- Consumes: `loadProgress()`, `getVocabularyById(id)`, `UserProgress.words`
- Produces: `getHomeProgressSummary().learnedWords: number`
- Produces: `getHomeQuickReview(now?: Date): { word: VocabularyItem; status: WordStatus } | null`

- [ ] **Step 1: Write failing tests for exact learned count and Quick review selection**

Add these assertions, plus a test using two real IDs from `getAllVocabulary()` to prove the most recently studied due word is selected:

```ts
saveProgress({
  learnedWordIds: [first.id, second.id],
  words: progressById,
  updatedAt: "2026-07-13T08:00:00.000Z",
})
expect(getHomeProgressSummary().learnedWords).toBe(2)
expect(getHomeQuickReview(now)).toMatchObject({
  word: { id: second.id },
  status: "review",
})
```

Also verify empty storage returns `null`.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/utils/homeProgress.test.ts`

Expected: FAIL because `learnedWords` and `getHomeQuickReview` do not exist.

- [ ] **Step 3: Implement the minimal read-only derivation**

Add `learnedWords: learnedWordIds.size` to `getHomeProgressSummary()`.

Add this selector after importing `getVocabularyById` from `./vocabulary`:

```ts
export function getHomeQuickReview(now = new Date()) {
  const progress = loadProgress()
  const candidates = Object.values(progress.words)
    .filter((item) => item.status !== "new" && item.lastStudiedAt)
    .sort((a, b) =>
      new Date(b.lastStudiedAt ?? 0).getTime() -
      new Date(a.lastStudiedAt ?? 0).getTime(),
    )
  const selected = candidates.find(
    (item) => !item.nextReviewAt || new Date(item.nextReviewAt) <= now,
  ) ?? candidates[0]
  if (!selected) return null
  const word = getVocabularyById(selected.wordId)
  return word ? { word, status: selected.status } : null
}
```

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/utils/homeProgress.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/utils/homeProgress.ts src/utils/homeProgress.test.ts
git commit -m "test: derive real home review data"
```

---

### Task 2: Specify Home Rendering and Original Actions

**Files:**
- Create: `src/pages/HomePage.test.tsx`

**Interfaces:**
- Consumes: `HomePage({ onOpenVocabulary, onStartFlashcard })`
- Produces: regression coverage for real-data-only rendering and original actions

- [ ] **Step 1: Write component tests for final behavior**

Mock auth/profile and grammar hooks only to stabilize rendering. Save one real vocabulary ID with `saveProgress`.

```ts
expect(screen.getByRole("img", { name: /สลอธ/i })).toHaveClass("object-contain")
expect(screen.getByText("Words learned")).toBeInTheDocument()
expect(screen.queryByText("Daily goal")).not.toBeInTheDocument()
expect(screen.queryByText("Day streak")).not.toBeInTheDocument()
expect(screen.queryByText("Today's missions")).not.toBeInTheDocument()
expect(screen.queryByText("8 / 20")).not.toBeInTheDocument()
expect(screen.queryByText("12 words")).not.toBeInTheDocument()
expect(screen.getByText(realWord.word)).toBeInTheDocument()
```

Verify empty storage hides Quick review. Verify the Continue button and all Explore buttons keep `#vocabulary` behavior:

```ts
await user.click(screen.getByRole("button", { name: /เรียนต่อ/i }))
expect(window.location.hash).toBe("#vocabulary")
await user.click(screen.getByRole("button", { name: /เปิดหมวด Travel/i }))
expect(window.location.hash).toBe("#vocabulary")
```

- [ ] **Step 2: Run and confirm failure against current Home**

Run: `npm test -- src/pages/HomePage.test.tsx`

Expected: FAIL because the current page renders unsupported sample data.

- [ ] **Step 3: Commit the failing regression test**

```powershell
git add -- src/pages/HomePage.test.tsx
git commit -m "test: specify home reference layout behavior"
```

---

### Task 3: Implement Responsive Reference Composition

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/styles.css`
- Create: four image files listed in File Map

**Interfaces:**
- Consumes: `stats.learnedWords`, `stats.totalWords`, `stats.progressPercentage`, `getHomeQuickReview()`
- Preserves: `handleContinueLearning`, `onStartFlashcard`, Explore navigation to `vocabulary`
- Produces: responsive Home DOM with no sample values

- [ ] **Step 1: Copy only truthful uploaded assets**

```powershell
Copy-Item -LiteralPath 'C:\Users\team7\OneDrive\เดสก์ท็อป\image1.png' -Destination 'src\assets\images\home-sloth-reference.png'
Copy-Item -LiteralPath 'C:\Users\team7\OneDrive\เดสก์ท็อป\image2.png' -Destination 'src\assets\images\continue-learning-reference.png'
Copy-Item -LiteralPath 'C:\Users\team7\OneDrive\เดสก์ท็อป\words learned.png' -Destination 'src\assets\images\stat-words-learned.png'
Copy-Item -LiteralPath 'C:\Users\team7\Downloads\ใบไม้.png' -Destination 'src\assets\images\home-leaf-accent.png'
```

Do not copy Daily goal or Day streak icons because those metrics have no truthful backing data.

- [ ] **Step 2: Replace Home markup with semantic regions in mobile order**

```tsx
<Container className="home-page py-4 sm:py-6 lg:py-8">
  <div className="home-dashboard">
    <section className="home-hero">...</section>
    <section className="home-stats">...</section>
    <section className="home-continue">...</section>
    <section className="home-explore">...</section>
    {quickReview ? <section className="home-quick-review">...</section> : null}
  </div>
</Container>
```

Hero uses the real profile name fallback and the uploaded image:

```tsx
<img
  src={slothHeroUrl}
  alt="สลอธกำลังเรียนภาษาอังกฤษ"
  className="h-full w-full object-contain object-bottom"
/>
```

Correct mojibake already present in Home copy; use the uploaded leaf asset instead of emoji. Stats renders only the exact learned count:

```tsx
<img src={wordsLearnedUrl} alt="" className="h-11 w-11 object-contain" />
<strong>{stats.learnedWords.toLocaleString()}</strong>
<span>Words learned</span>
```

Continue uses real overall progress and only its button is clickable:

```tsx
<span>{stats.learnedWords.toLocaleString()} / {stats.totalWords.toLocaleString()} คำ</span>
<div role="progressbar" aria-valuenow={stats.progressPercentage} aria-valuemin={0} aria-valuemax={100}>
  <div style={{ width: `${stats.progressPercentage}%` }} />
</div>
<button type="button" onClick={handleContinueLearning}>เรียนต่อ</button>
<img src={continueLearningUrl} alt="" className="h-full w-full object-contain" />
```

Keep five Explore buttons and their existing route, adding accessible names such as `aria-label="เปิดหมวด Travel"`. Omit Today’s missions entirely.

Quick review renders only a real word and stored status:

```tsx
{quickReview ? (
  <article>
    <Volume2 aria-hidden="true" />
    <strong>{quickReview.word.word}</strong>
    <span>{quickReview.word.partOfSpeechStandard ?? quickReview.word.partOfSpeech}</span>
    <span>{quickReview.word.thaiMeaning}</span>
    <span>{statusLabels[quickReview.status]}</span>
  </article>
) : null}
```

The sound icon remains non-interactive because the existing Home control has no action; do not add speech behavior.

- [ ] **Step 3: Add Home-only responsive CSS**

```css
.home-dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  min-width: 0;
}
.home-explore-scroll {
  display: flex;
  gap: 0.75rem;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}
@media (min-width: 1024px) {
  .home-dashboard {
    grid-template-columns: minmax(0, 1.65fr) minmax(17rem, 0.75fr);
    grid-template-areas:
      "hero hero"
      "stats stats"
      "continue quick"
      "explore quick";
    gap: 1.25rem;
  }
}
```

Assign the matching grid areas. Keep `min-width: 0` on grid/flex children, use `overflow-wrap: anywhere` for dynamic names, and remove hover transforms under `prefers-reduced-motion`.

- [ ] **Step 4: Run focused navigation and Home tests**

Run: `npm test -- src/pages/HomePage.test.tsx src/utils/homeProgress.test.ts src/App.navigation.test.tsx src/App.hash-routing.test.tsx`

Expected: PASS. Update obsolete visible-copy expectations only; keep navigation assertions intact.

- [ ] **Step 5: Build**

Run: `npm run build`

Expected: TypeScript and Vite build successfully.

- [ ] **Step 6: Commit implementation**

```powershell
git add -- src/pages/HomePage.tsx src/styles.css src/assets/images/home-sloth-reference.png src/assets/images/continue-learning-reference.png src/assets/images/stat-words-learned.png src/assets/images/home-leaf-accent.png
git commit -m "feat: redesign home around real learning data"
```

Add `src/App.test.tsx` only if its obsolete copy assertions were updated. Never stage unrelated files.

---

### Task 4: Browser QA and Regression Verification

**Files:**
- Modify if defects are observed: `src/pages/HomePage.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: implemented Home page
- Produces: verified responsive layout with no overlap or page overflow

- [ ] **Step 1: Start Vite**

Run: `npm run dev -- --host 127.0.0.1`

Expected: local URL reported and server remains running.

- [ ] **Step 2: Inspect Desktop at 1440×1000**

Verify Sidebar, Hero, one truthful stat, wider left column, contained images, hidden unsupported sections, and original buttons. In browser console run `document.documentElement.scrollWidth === document.documentElement.clientWidth`; expected `true`.

- [ ] **Step 3: Inspect 320×800, 375×812 and 768×1024**

Verify Bottom Navigation visible, Sidebar hidden, no Hero overlap, cards stay inside viewport, Explore scrolls internally, Quick review wraps, and the same overflow expression returns `true`.

- [ ] **Step 4: Fix only observed defects, then rerun focused tests and build**

Run: `npm test -- src/pages/HomePage.test.tsx src/utils/homeProgress.test.ts` and `npm run build`.

Expected: PASS and successful build.

- [ ] **Step 5: Run full regression suite**

Run: `npm test`

Expected: all tests pass. Record exact unrelated pre-existing failures without editing unrelated code.

- [ ] **Step 6: Run design detector**

Run: `node .agents/skills/impeccable/scripts/detect.mjs --json src/pages/HomePage.tsx src/styles.css`

Expected: no new high-severity overflow, contrast, excessive-radius, gradient-text or decorative-motion findings.

- [ ] **Step 7: Commit QA fixes if needed**

```powershell
git add -- src/pages/HomePage.tsx src/styles.css
git commit -m "fix: harden home responsive layout"
```

Skip if QA requires no changes.

## Plan Self-Review

- Spec coverage: assets, real data, existing actions, Desktop structure, Mobile order, 320px support, overflow, accessibility and verification all map to tasks.
- Placeholder scan: no TBD, TODO or deferred implementation remains.
- Type consistency: Task 1 defines `learnedWords` and `getHomeQuickReview`; Task 3 consumes the same names.
- Scope: work remains inside Home UI, read-only derivation, tests and uploaded assets; no subsystem is added.
