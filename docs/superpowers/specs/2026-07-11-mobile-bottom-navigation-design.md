# Mobile Bottom Navigation Design

## Goal

Replace the current compact mobile header navigation with a stable six-item bottom navigation while preserving the existing desktop and tablet navigation unchanged.

## Scope

- Apply the bottom navigation only below the existing `sm` breakpoint (640px).
- Retain the header brand on mobile and hide the current header navigation links and duplicate header account entry point there.
- Preserve the desktop and tablet header navigation, its labels, and its layout at 640px and above.
- Keep the account entry point as the existing login/profile flow; it is the sixth bottom-navigation item.
- Do not add a `progress` route or change the existing progress summary on the Home page.

## Navigation Model

The mobile bar has six equal-width buttons in this order:

1. หน้าแรก — `home`
2. คำศัพท์ — `vocabulary` (also active for `wordDetail`)
3. ฝึกจำ — `flashcard`
4. ฝึก — `quiz`
5. สนทนา — `speak`
6. บัญชี — `auth` while signed out, `profile` while signed in

Each button continues to call the existing `onNavigate` callback. The account item reads the same auth state as the existing `UserMenu`: it navigates to `auth` while signed out and `profile` while signed in. It is active on either account destination. No existing routes or their behavior change, and the current Home page retains its progress summary.

## Visual and Responsive Design

- The shared `Navigation` component renders a mobile-only fixed bottom `<nav>` and uses a six-column grid so every item has identical width.
- The bar uses a soft green background aligned to the existing leaf/emerald system, separated from page content by a subtle top border.
- Every item centers a 20px existing Lucide icon above the same text size. Each item has at least a 44px touch target.
- Active items use dark green icon and label with a compact soft-green highlight. The highlight changes only color/background; it never changes an item's dimensions or the bar's height.
- Inactive items use a muted dark-green text color that keeps adequate contrast against the bar background.
- The fixed bar includes `env(safe-area-inset-bottom)`. `AppLayout` adds matching mobile-only bottom padding to `<main>` so no page content can sit behind the bar.
- `index.html` enables `viewport-fit=cover` for iPhone safe areas.

## Accessibility

- Use semantic `<nav aria-label="เมนูหลักบนมือถือ">` and native buttons.
- Mark the current destination with `aria-current="page"`.
- Keep visible labels, keyboard focus rings, and a non-color active indicator.
- `wordDetail` retains Vocabulary as its active parent destination.

## Validation

- Add tests for all six mobile navigation destinations, active-state semantics, the signed-out/signed-in account destination, and the `wordDetail` to Vocabulary mapping.
- Preserve the current hash-routing coverage without adding a new route.
- Verify the desktop navigation remains available and the mobile bar is hidden at `sm` and above through responsive class assertions.
- Run the focused tests, all navigation-related tests, TypeScript/Vite build, and responsive browser checks at a narrow mobile viewport and a tablet/desktop viewport.
