# Mobile Bottom Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a six-item, safe-area-aware mobile bottom navigation while keeping tablet and desktop navigation unchanged.

**Architecture:** `Navigation` remains the shared navigation source. It renders the existing header navigation only at `sm` and above and a mobile-only six-column bar below `sm`; the sixth item derives its destination from existing auth state. `AppLayout` supplies the matching mobile content clearance.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React, Vitest, React Testing Library, Vite.

## Global Constraints

- Apply the bottom navigation only below `sm` (640px); preserve the existing header navigation at `sm` and above.
- Preserve all existing routes and hash behavior; do not add a Progress route.
- The account item sends signed-out users to `auth` and signed-in users to `profile`.
- Keep six equal touch targets, visible labels, `aria-current`, focus rings, safe-area support, and no new dependencies.

---

### Task 1: Render the shared mobile six-item navigation

**Files:**
- Modify: `src/components/layout/Navigation.tsx:1-63`
- Modify: `src/components/layout/Navigation.hardening.test.tsx:1-20`
- Test: `src/components/layout/Navigation.hardening.test.tsx`

**Interfaces:**
- Consumes: `NavigationProps` and `useAuth().user`.
- Produces: `<nav aria-label="เมนูหลักบนมือถือ">` with destinations `home`, `vocabulary`, `flashcard`, `quiz`, `speak`, and `auth` or `profile`.

- [ ] **Step 1: Write the failing tests**

```tsx
it("renders six equal mobile destinations while keeping desktop navigation separate", () => {
  const { container } = render(<Navigation activePage="home" onNavigate={vi.fn()} />)
  const mobileNav = screen.getByRole("navigation", { name: "เมนูหลักบนมือถือ" })

  expect(mobileNav).toHaveClass("sm:hidden", "grid-cols-6")
  expect(within(mobileNav).getAllByRole("button")).toHaveLength(6)
  expect(container.querySelector('header nav[aria-label="เมนูหลัก"]')).toHaveClass("hidden", "sm:flex")
})

it("marks Vocabulary active for word detail and sends signed-out accounts to Login", async () => {
  const onNavigate = vi.fn()
  render(<Navigation activePage="wordDetail" onNavigate={onNavigate} />)

  expect(screen.getByRole("button", { name: "คำศัพท์" })).toHaveAttribute("aria-current", "page")
  await userEvent.setup().click(screen.getByRole("button", { name: "บัญชี" }))
  expect(onNavigate).toHaveBeenCalledWith("auth")
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/layout/Navigation.hardening.test.tsx`

Expected: FAIL because no mobile landmark or six-column navigation exists.

- [ ] **Step 3: Implement the minimal shared component changes**

```tsx
const { user } = useAuth()
const isVocabularyActive = activePage === "vocabulary" || activePage === "wordDetail"
const accountPage = user ? "profile" : "auth"

<nav aria-label="เมนูหลักบนมือถือ" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-emerald-200 bg-[#E8F5EC] px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 sm:hidden">
  {/* five existing learning destinations plus the account destination */}
</nav>
```

Use identical `min-h-11`/`min-w-11` buttons, 20px icons, 11px labels, focus rings, and `aria-current="page"` for active destinations. Use `bg-[#CFE8D5] text-[#166534]` for active and a contrast-safe muted green for inactive. Set the header primary nav to `hidden sm:flex`, and wrap the mobile-duplicate `UserMenu` in `hidden sm:block`.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- src/components/layout/Navigation.hardening.test.tsx`

Expected: PASS with all existing and new navigation assertions.

### Task 2: Prevent the fixed bar from obscuring content

**Files:**
- Modify: `src/components/layout/AppLayout.tsx:10-16`
- Modify: `index.html:5`
- Create: `src/components/layout/AppLayout.test.tsx`
- Test: `src/components/layout/AppLayout.test.tsx`

**Interfaces:**
- Consumes: `AppLayoutProps` unchanged.
- Produces: a mobile-only safe-area-aware bottom clearance on `<main>`.

- [ ] **Step 1: Write the failing layout test**

```tsx
it("reserves mobile safe-area space for the bottom navigation", () => {
  const { container } = render(<AppLayout activePage="home" onNavigate={vi.fn()}><p>Content</p></AppLayout>)
  expect(container.querySelector("main")).toHaveClass(
    "pb-[calc(4.5rem+env(safe-area-inset-bottom))]",
    "sm:pb-0",
  )
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/layout/AppLayout.test.tsx`

Expected: FAIL because `<main>` has no bottom-navigation clearance.

- [ ] **Step 3: Implement minimum safe-area support**

```tsx
<main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0">{children}</main>
```

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

- [ ] **Step 4: Run the focused layout test to verify it passes**

Run: `npm test -- src/components/layout/AppLayout.test.tsx`

Expected: PASS with `1 passed`.

### Task 3: Verify destinations, breakpoints, and build

**Files:**
- Test: `src/components/layout/Navigation.hardening.test.tsx`
- Test: `src/App.hash-routing.test.tsx`

**Interfaces:**
- Consumes: existing `onNavigate(page: AppPage)` and hash-routing behavior.
- Produces: regression coverage for all six mobile actions without a new route.

- [ ] **Step 1: Add failing destination assertions**

```tsx
const expectedDestinations = ["home", "vocabulary", "flashcard", "quiz", "speak", "auth"] as const
// Render signed out; click each uniquely named mobile button; assert onNavigate receives each value.
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/layout/Navigation.hardening.test.tsx src/App.hash-routing.test.tsx`

Expected: FAIL until all six mobile actions use their intended destinations.

- [ ] **Step 3: Run regression and build verification**

Run: `npm test -- src/components/layout/Navigation.hardening.test.tsx src/components/layout/AppLayout.test.tsx src/App.hash-routing.test.tsx src/App.test.tsx`

Expected: PASS with no failing test files.

Run: `npm run build`

Expected: exit code `0` after `tsc -b && vite build`.

- [ ] **Step 4: Verify responsive behavior**

At 375px, check equal widths, every active state, all six navigation actions, and content clearance. At 768px and 1024px, check that the bottom bar is hidden and the existing header navigation is unchanged.

- [ ] **Step 5: Commit the implementation**

```bash
git add src/components/layout/Navigation.tsx src/components/layout/Navigation.hardening.test.tsx src/components/layout/AppLayout.tsx src/components/layout/AppLayout.test.tsx index.html
git commit -m "feat: add mobile bottom navigation"
```
