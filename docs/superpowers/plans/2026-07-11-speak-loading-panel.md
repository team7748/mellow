# Speak Loading Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make pending Speak Mode answer evaluation visibly responsive with a concise, accessible loading panel.

**Architecture:** Render the panel only while the existing `isChecking` state is true. Keep the existing interaction lock unchanged and define the panel's motion in the application stylesheet behind `prefers-reduced-motion: no-preference` so reduced-motion users receive the same information without looping movement.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Do not change the API request, evaluator, answer results, audio, progress, or navigation behavior.
- Copy must be exactly `กำลังวิเคราะห์คำตอบ…` in the visible panel.
- The panel must announce its status politely without interrupting the user's current screen-reader context.
- Motion must use opacity/transform only, stay under 500ms per cycle, and be disabled for `prefers-reduced-motion: reduce`.
- Do not add dependencies.

---

### Task 1: Cover the pending evaluation UI

**Files:**
- Modify: `src/components/speak/InteractivePracticePlayer.test.tsx`

**Interfaces:**
- Consumes: the existing pending `checkSpeakAnswer()` promise and `isChecking` state.
- Produces: coverage that asserts a non-blocking, accessible loading panel appears while evaluation is pending.

- [ ] **Step 1: Write the failing test**

```tsx
it("shows an accessible analysis panel while the answer check is pending", async () => {
  vi.mocked(checkSpeakAnswer).mockImplementation(() => new Promise(() => {}))
  const user = userEvent.setup()
  render(<InteractivePracticePlayer categoryTitle="Morning" questions={[question]} />)

  await user.type(screen.getByLabelText("Your Answer"), "I wake up at seven")
  await user.click(screen.getByRole("button", { name: "Check Answer" }))

  expect(screen.getByRole("status")).toHaveTextContent("กำลังวิเคราะห์คำตอบ…")
  expect(screen.getByTestId("speak-answer-loading-panel")).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/speak/InteractivePracticePlayer.test.tsx`

Expected: FAIL because the current pending view only contains `กำลังตรวจคำตอบ` and has no loading-panel test id.

- [ ] **Step 3: Write minimal implementation**

```tsx
{isChecking && (
  <div
    className="speak-answer-loading-panel"
    data-testid="speak-answer-loading-panel"
    role="status"
    aria-live="polite"
  >
    <span className="speak-answer-loading-dots" aria-hidden="true"><i /><i /><i /></span>
    <div><p>กำลังวิเคราะห์คำตอบ…</p><p>ตรวจความหมายและไวยากรณ์ให้คุณอยู่</p></div>
  </div>
)}
```

Add matching CSS classes under `@media (prefers-reduced-motion: no-preference)` with a three-dot opacity/transform animation. Add a static, visible fallback outside that media query.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/speak/InteractivePracticePlayer.test.tsx`

Expected: PASS, including the existing duplicate-request and editor-lock assertions.

### Task 2: Verify the responsive motion surface

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: loading-panel class names from `InteractivePracticePlayer`.
- Produces: a visual loading state that fits the existing answer card and has a static reduced-motion fallback.

- [ ] **Step 1: Inspect the rendered panel at desktop and 360px widths**

Run the Vite dev server, hold `checkSpeakAnswer` pending in the component test or browser, and inspect desktop plus 360px views.

- [ ] **Step 2: Verify reduced-motion behavior**

In the browser, emulate `prefers-reduced-motion: reduce` and verify the panel retains its text and dots without animated transforms or opacity loops.

- [ ] **Step 3: Run full verification**

Run: `npm test -- src/components/speak/InteractivePracticePlayer.test.tsx && npm run build`

Expected: the focused test and TypeScript/Vite build both exit 0.
