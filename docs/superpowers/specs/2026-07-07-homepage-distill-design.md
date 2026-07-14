# HomePage Distill Design

## Context

The current Home page is doing two jobs at once: it introduces the app and acts
as a full progress dashboard. That makes the first screen feel like a tidy admin
surface before it feels like a calm daily learning session.

The selected direction is a premium calm learning app. The scope is Top 3 only,
with the first change focused on making Home a study launcher.

## Goal

Turn `HomePage` into a focused study launcher that helps Thai learners start a
short vocabulary session quickly.

The first screen should answer one question:

> What should I study next?

## Non-Goals

- Do not redesign Flashcard mode in this pass.
- Do not redesign Vocabulary cards in this pass.
- Do not add a new route for progress settings.
- Do not change the progress calculation or storage model.
- Do not add new dependencies.
- Do not introduce heavy animation or decorative visuals.

## User-Facing Requirements

- Show one dominant primary action to start practice.
- Keep a secondary action to open the vocabulary list.
- Show a compact learning/progress summary without exposing management tools.
- Remove the full `ProgressDashboard` from the Home page.
- Remove import, export, and reset actions from the first Home experience.
- Use Thai-first operational copy.
- Keep English visible where it names the learning content or mode.
- Preserve mobile-first readability and large touch targets.

## Home Structure

### 1. Study Launcher

The top section should be the main experience, not a card-heavy dashboard.

Content:

- Short Thai headline focused on continuing study.
- One concise supporting sentence.
- Primary button: start Flashcard practice.
- Secondary button: open Vocabulary.

The primary action should be visually dominant and easy to tap on mobile.

### 2. Compact Learning Summary

Replace the right-side dashboard cards with one restrained summary panel.

Possible content:

- Total vocabulary count.
- A small mastered/progress percentage.
- A short prompt such as "เริ่มจากชุดสั้น ๆ วันนี้".
- A simple progress bar if it stays visually quiet.

This summary must not expose import/export/reset.

### 3. Today's Study Path

Replace the repeated feature-card grid with a compact ordered path or small list.

Recommended items:

1. ฟังและอ่านคำศัพท์
2. พลิกการ์ดเพื่อดูความหมาย
3. เลือกว่าจำได้หรือควรทบทวน

This section should feel like guidance, not marketing feature cards.

## Visual Direction

- Use fewer elevated cards than the current Home page.
- Reserve strong card treatment for the primary study launcher or summary only.
- Prefer spacing, alignment, and type hierarchy over repeated shadows.
- Keep the existing restrained palette, but reduce visual noise.
- Avoid uppercase tracked kickers on Home.
- Avoid identical card grids.
- Keep border radius at the existing `rounded-lg` scale.
- Use icons only when they clarify actions; do not add decorative icons.

## Copy Direction

Use Thai as the operating language.

Examples:

- "ฝึกคำศัพท์อังกฤษแบบเป็นระบบ" can become more action-oriented.
- "English vocabulary for Thai learners" should be removed or reduced.
- "Today's focus" should become Thai or disappear.
- "Learning overview" should become Thai or disappear.
- "Progress" should become a compact Thai progress label.

The tone should be calm, direct, and not exam-like.

## Code Structure

Update:

- `src/pages/HomePage.tsx`

Keep:

- Existing `Button`
- Existing `Container`
- Existing `ProgressDashboard` component, but stop rendering it on Home
- Existing `FeatureCard` component, but Home does not need to use it

Add only small local constants or helper functions inside `HomePage.tsx` if they
make the page clearer. Avoid introducing a new component unless the markup
becomes difficult to scan.

## Data

The Home page may use existing progress utilities if a compact summary needs
real values:

- `getAllVocabulary()`
- `calculateProgressStats()`

If used, derive only the minimal values needed for the summary. Do not duplicate
the full dashboard.

## Accessibility

- Primary and secondary actions must remain keyboard focusable.
- Button targets should remain at least the current `min-h-12` scale.
- Text must remain readable on mobile.
- Progress information must not rely on color alone.
- The page should still make sense with the summary hidden or skipped by a
  screen reader.

## Testing

Update Home-related tests if they currently expect the old dashboard-heavy
layout.

Recommended assertions:

- Home renders the primary Flashcard start action.
- Home renders the Vocabulary secondary action.
- Home no longer renders progress management actions such as import, export, or
  reset.
- Clicking the primary action still opens Flashcard mode.
- Clicking the secondary action still opens Vocabulary.

## Acceptance Criteria

- The first viewport has one clear primary study action.
- The page no longer feels like a full dashboard.
- Import/export/reset progress actions are not visible on Home.
- Thai-first copy is used for Home UI scaffolding.
- The layout is calmer and less card-heavy.
- Existing navigation to Flashcard and Vocabulary still works.
- The app builds successfully after the change.
