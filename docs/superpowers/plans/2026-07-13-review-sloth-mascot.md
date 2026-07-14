# Review Sloth Mascot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the supplied sloth sprite as a non-blocking animated companion to the existing Home Quick Review `เริ่มทบทวน` button without changing the button's action, route, or review data.

**Architecture:** Extract six fixed-size transparent PNG frames with a deterministic, dependency-free image script. Render them through a focused `ReviewSlothMascot` component that owns frame state and timers and exposes only `playWave()` and `playCelebrate(onDone)` through a ref. Wrap the existing Quick Review CTA in a relative shell; HomePage keeps the existing review callback and only triggers the mascot ref from pointer/focus/click handlers.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind utility classes, existing `src/styles.css` keyframes, Node built-ins (`zlib`, `fs`) for one-off PNG extraction, Vitest + Testing Library, in-app browser viewport checks.

## Global Constraints

- Modify only Home Quick Review presentation and supporting mascot assets/styles.
- Do not add a second review button or change `startFlashcard`, routing, progress state, activity ledger, or review-count calculations.
- Do not add an animation dependency.
- Use `alt=""`, `aria-hidden="true"`, `pointer-events: none`, and `object-fit: contain` for mascot frames.
- Render mascot and speech bubble only when `stats.dueReviewWords > 0`.
- Preserve all unrelated dirty worktree changes.
- Support `prefers-reduced-motion: reduce` with only a short opacity reveal.

---

### Task 1: Create deterministic transparent sloth frames

**Files:**
- Create: `scripts/extract-sloth-frames.mjs`
- Create: `src/assets/mascot/sloth/idle.png`
- Create: `src/assets/mascot/sloth/wave.png`
- Create: `src/assets/mascot/sloth/celebrate.png`
- Create: `src/assets/mascot/sloth/thumbs-up.png`
- Create: `src/assets/mascot/sloth/blink.png`
- Create: `src/assets/mascot/sloth/nod.png`
- Source: `C:/Users/team7/Downloads/น้องสลอธ.png`

**Interfaces:**
- Script input: source path, output directory, fixed frame definitions.
- Script output: six PNG files with identical width, height, RGBA color type, and transparent chroma-keyed background.

- [ ] **Step 1: Inspect the source PNG header and choose fixed crop rectangles**

Use the source's 1448×1086 canvas and record six manually verified rectangles around the selected poses. Every rectangle must have the same output dimensions; pad the smaller visible subject inside a shared canvas rather than changing the output size.

- [ ] **Step 2: Write the extraction script**

Implement only Node built-ins: decode the PNG scanlines with `zlib.inflateSync`, crop each rectangle, set pixels near the source green background to alpha 0 using a distance threshold, preserve all other RGB values, and encode non-interlaced RGBA PNGs with `zlib.deflateSync`. Fail fast if the source dimensions or crop bounds do not match the recorded values.

- [ ] **Step 3: Run the script and inspect generated files**

Run:

```powershell
node scripts/extract-sloth-frames.mjs "C:/Users/team7/Downloads/น้องสลอธ.png" src/assets/mascot/sloth
```

Expected: six PNGs are created, all have equal dimensions, and no bright-green background remains around the character.

- [ ] **Step 4: Verify image metadata without editing source assets**

Use a read-only PNG header check to assert each output is RGBA and has identical dimensions. Use `view_image` on a contact sheet or individual outputs to verify pose identity, no crop of hands/feet, and stable framing.

- [ ] **Step 5: Commit the asset extraction unit**

```powershell
git add scripts/extract-sloth-frames.mjs src/assets/mascot/sloth
git commit -m "feat: add transparent review sloth frames"
```

---

### Task 2: Build the mascot state machine with tests first

**Files:**
- Create: `src/components/home/ReviewSlothMascot.tsx`
- Create: `src/components/home/ReviewSlothMascot.test.tsx`
- Modify: `src/styles.css` (only mascot keyframes and reduced-motion rules)

**Interfaces:**

```ts
export type ReviewSlothMascotHandle = {
  playWave: () => void
  playCelebrate: (onDone: () => void) => void
}

type ReviewSlothMascotProps = {
  visible: boolean
}
```

- [ ] **Step 1: Write failing visibility and accessibility tests**

```tsx
it("renders no mascot or speech bubble when review count is unavailable", () => {
  render(<ReviewSlothMascot ref={createRef()} visible={false} />)
  expect(screen.queryByTestId("review-sloth-mascot")).not.toBeInTheDocument()
  expect(screen.queryByText("มาทบทวนกัน!")).not.toBeInTheDocument()
})

it("renders a decorative mascot when visible", () => {
  render(<ReviewSlothMascot ref={createRef()} visible />)
  expect(screen.getByTestId("review-sloth-mascot")).toHaveAttribute("aria-hidden", "true")
  expect(screen.getByRole("img", { hidden: true })).toHaveAttribute("alt", "")
})
```

- [ ] **Step 2: Write failing timer and imperative-action tests**

Use fake timers. Assert reveal is delayed, speech bubble appears after reveal, the recurring action uses one timeout at a time, `playWave()` returns to idle, `playCelebrate()` invokes its callback only once after 250–400ms, and unmount clears all scheduled timers.

```tsx
it("cleans reveal, speech, and recurring timers on unmount", () => {
  vi.useFakeTimers()
  const { unmount } = render(<ReviewSlothMascot ref={createRef()} visible />)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
  vi.useRealTimers()
})
```

- [ ] **Step 3: Implement the minimal component**

Use `forwardRef` and `useImperativeHandle`. Keep `frame` and `action` state inside the component. Use a recursive `setTimeout` with a random 6000–10000ms delay; never use an interval. Use a single cleanup effect for every timer. The component must render an absolutely positioned wrapper with `pointer-events-none`, a frame `<img>`, and the speech bubble.

- [ ] **Step 4: Add CSS motion primitives**

Add named keyframes/classes to `src/styles.css`:

- `review-sloth-reveal`: opacity + `translateY` over 700ms with ease-out.
- `review-sloth-breathe`: 2–4px translate and 1–1.5% scale over a slow loop.
- `review-sloth-wave`, `review-sloth-celebrate`, and `review-sloth-bubble` for short state feedback.
- In `@media (prefers-reduced-motion: reduce)`, remove breathing/action animation and leave only the reveal opacity transition.

- [ ] **Step 5: Run focused mascot tests**

```powershell
npx vitest run src/components/home/ReviewSlothMascot.test.tsx
```

Expected: all mascot tests pass with no leaked timers.

- [ ] **Step 6: Commit the component unit**

```powershell
git add src/components/home/ReviewSlothMascot.tsx src/components/home/ReviewSlothMascot.test.tsx src/styles.css
git commit -m "feat: add review sloth mascot motion"
```

---

### Task 3: Integrate with the existing Quick Review CTA

**Files:**
- Modify: `src/pages/HomePage.tsx` at the Quick Review section and existing `startFlashcard` CTA.
- Modify: `src/pages/HomePage.test.tsx` or the existing Home test file that covers Quick Review.

**Interfaces:**
- Consume `ReviewSlothMascot` and `ReviewSlothMascotHandle` from Task 2.
- Keep the existing `startFlashcard()` implementation unchanged.

- [ ] **Step 1: Write failing Home integration tests**

Cover the real Home data path, not a hard-coded count:

```tsx
it("mounts the mascot only when due review words are greater than zero", () => {
  // Seed the existing vocabulary progress helper with one due word.
  render(<HomePage onStartFlashcard={vi.fn()} />)
  expect(screen.getByTestId("review-sloth-mascot")).toBeInTheDocument()
})

it("keeps the existing Quick Review button and callback", async () => {
  const onStartFlashcard = vi.fn()
  render(<HomePage onStartFlashcard={onStartFlashcard} />)
  await user.click(screen.getByRole("button", { name: "เริ่มทบทวน" }))
  expect(onStartFlashcard).toHaveBeenCalledTimes(1)
})
```

If the existing test harness does not expose a stable due-word fixture, add only a local fixture through the existing storage helper; do not add production defaults or fake counts.

- [ ] **Step 2: Wrap, do not duplicate, the existing CTA**

Place a `relative overflow-visible` shell around the existing `เริ่มทบทวน` button. Keep the original button text, classes, `type`, and `onClick` action. Add the mascot behind it with a lower z-index and add `onPointerEnter`, `onFocus`, and `onClick` handlers that trigger the mascot ref while preserving the original callback.

- [ ] **Step 3: Add the speech bubble inside the same card**

Keep the Quick Review section as one visual box. Change only the local clipping needed for the mascot (`overflow-visible` on the section/shell). Do not introduce a second card or a new review affordance. Hide the bubble at the smallest breakpoint with a responsive utility/class.

- [ ] **Step 4: Run Home integration tests**

```powershell
npx vitest run src/pages/HomePage.test.tsx src/App.test.tsx
```

Expected: the original Home route and Quick Review callback tests pass; exactly one `เริ่มทบทวน` button remains.

- [ ] **Step 5: Commit the Home integration**

```powershell
git add src/pages/HomePage.tsx src/pages/HomePage.test.tsx src/App.test.tsx
git commit -m "feat: attach sloth mascot to quick review"
```

---

### Task 4: Full verification and responsive browser QA

**Files:**
- Modify only if verification finds a mascot-specific defect: `src/components/home/ReviewSlothMascot.tsx`, `src/pages/HomePage.tsx`, or `src/styles.css`.

- [ ] **Step 1: Run static checks**

```powershell
npm run lint
npx tsc -b --pretty false
npm run build
git diff --check
```

Expected: all commands exit 0. Existing unrelated warnings must be recorded separately and not fixed in this feature.

- [ ] **Step 2: Run focused and full tests**

```powershell
npx vitest run src/components/home/ReviewSlothMascot.test.tsx src/pages/HomePage.test.tsx
npm test
```

Expected: focused mascot/Home tests pass; any pre-existing full-suite failures are reported by exact test name and are not masked.

- [ ] **Step 3: Run browser QA at 320px**

Inspect `#home` with a real 320px viewport. Confirm the mascot does not create horizontal overflow, the CTA remains fully clickable, the speech bubble is hidden at the smallest breakpoint, and no layout shift occurs when the mascot reveals.

- [ ] **Step 4: Run browser QA at desktop width**

Inspect `#home` at the largest viewport the browser tool can set. Confirm the mascot is 90–120px tall, sits behind the top edge of the Quick Review CTA, does not cover text/count/arrow, and the original button remains the only review button.

- [ ] **Step 5: Verify reduced motion and cleanup**

Use the browser's reduced-motion emulation if available, or inspect the computed media-query styles. Confirm no recurring action animation runs and that unmounting the Home page leaves no pending mascot timers in the component test.

- [ ] **Step 6: Commit final verification adjustments**

```powershell
git status --short
git diff --check
git commit -am "test: verify review sloth responsive behavior"
```

Only commit if Task 4 required a real source adjustment; otherwise leave the previous focused commits intact and report the verification results.

