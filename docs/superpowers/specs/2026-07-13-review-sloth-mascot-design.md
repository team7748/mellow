# Review Sloth Mascot — Home Quick Review

## Goal

Add the supplied sloth sprite sheet as a small animated mascot attached to the existing Home Quick Review card's `เริ่มทบทวน` button. The existing button, action, route, review count, and visibility rules remain the source of truth.

## Scope and boundaries

- Modify only the Home Quick Review presentation and its supporting mascot assets/styles.
- Do not add a second review button or change `startFlashcard`, routing, progress state, activity ledger, or review-count calculations.
- Do not add an animation dependency. Use the project's existing CSS animation approach and a small React component for frame/action state.
- Preserve all unrelated dirty worktree changes.

## Asset preparation

Create six deterministic PNG frames from `C:/Users/team7/Downloads/น้องสลอธ.png` under `src/assets/mascot/sloth/`:

- `idle.png`: seated waiting pose
- `wave.png`: one-arm wave pose
- `celebrate.png`: raised-arms celebration pose
- `thumbs-up.png`: thumbs-up pose
- `blink.png`: eyes-closed/resting pose
- `nod.png`: calm head-lowered/nod-like pose

Each frame uses the same crop bounds and canvas dimensions. The bright green chroma background is removed to alpha transparency. No character redraw, recoloring, or shape alteration is allowed. Images are rendered with `object-fit: contain`.

## Component design

Add `src/components/home/ReviewSlothMascot.tsx` with a narrow interface:

- Props: `visible: boolean`
- A forwarded ref exposing `playWave()` and `playCelebrate(onDone)` so the existing button owns pointer and click behavior while mascot state remains local to the mascot component.
- Hover/focus and click state remain local to the mascot; the parent only triggers those two explicit actions.

The component is decorative (`alt=""`, `aria-hidden="true"`, `pointer-events: none`) and is positioned absolutely inside a relative wrapper around the existing Quick Review CTA. The wrapper uses `overflow: visible`; no page-level overflow change is needed.

## Interaction and motion

1. On mount while visible, keep the mascot behind the card edge for 800–1,200ms, then reveal with `translateY` and opacity over 600–800ms.
2. While idle, use a slow 2–4px vertical breathing motion and a 1–1.5% scale change.
3. Schedule one random short action every 6–10 seconds using a recursively scheduled timeout. Clean up all timers on unmount and whenever `visible` changes.
4. Hover/focus on the existing `เริ่มทบทวน` button selects the wave pose once and then returns to idle.
5. Clicking the existing button selects the celebration pose for approximately 250–400ms, then invokes the existing `startFlashcard` action. No new route or action is introduced.
6. Show a small speech bubble inside the same Quick Review visual box approximately 500ms after reveal, keep it visible for 2–3 seconds, then fade it out. Hide it at very small widths.
7. Under `prefers-reduced-motion: reduce`, disable breathing, random actions, hover choreography, and click choreography; retain only a short opacity reveal.

## Visibility and responsive behavior

- Render the mascot and bubble only when `stats.dueReviewWords > 0`.
- Desktop mascot height: 90–120px.
- Tablet mascot height: 75–100px.
- Mobile mascot height: 58–78px.
- Keep the mascot toward the right side of the CTA without covering the label, count, icon, or arrow.
- The mascot must not consume normal layout space or cause layout shift.

## Verification

- Add component tests for visibility, initial reveal scheduling, timer cleanup, reduced-motion class/state, and preservation of the existing click callback.
- Run lint, TypeScript, production build, and focused Home tests.
- Verify the Quick Review CTA remains fully clickable at 320px and desktop width, with no horizontal overflow or layout shift.
- Confirm no duplicate review button appears and no new dependency is added.
