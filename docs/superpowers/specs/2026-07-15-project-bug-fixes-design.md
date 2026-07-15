# Project Bug Fixes Design

## Goal

Restore a clean build, passing automated tests, clean lint output, and working runtime interactions while preserving the current Tailwind UI work and the user's in-progress profile/avatar changes.

## Scope

The repair covers every issue reproduced during the audit:

- Speak conversation completion crashes because `user` is undefined and records activity in the wrong order.
- Home statistics lost region semantics, and the Speak mission label no longer matches the established product contract.
- Flashcard training mode cards lost radio semantics during the shared-component refactor.
- Vocabulary cards render a boolean instead of their category label.
- The configured lint command fails, and the edited frontend files contain unused imports, unsafe hook ordering, incomplete hook dependencies, manual-memoization issues, and trailing whitespace.
- The full test command reports regressions and previously remained alive after unhandled Speak exceptions.
- The in-progress profile/avatar implementation must compile and follow the existing authenticated Supabase profile/storage patterns.

## Chosen Approach

Use behavior-preserving repair rather than reverting the Tailwind refactor or weakening tests. Existing tests, product specs, and the last working implementations define the behavioral contract. Visual sizing, colors, layout, and the current profile redesign remain intact unless a change is required for correctness, accessibility, or responsive runtime behavior.

## Repair Design

### Speak completion

Conversation completion is idempotent. On the first completion, update and persist local Speak progress synchronously, then record one learning-activity event, then navigate to the next conversation or practice view. A repeated completion does not persist or record again. Event identity continues to use the activity layer's active authenticated-user fallback, so `SpeakModePage` does not subscribe to authentication solely to duplicate that state. Persistence failure prevents activity recording and remains observable to the caller.

Keyboard handlers and completion callbacks in the Speak players will be declared in dependency-safe order and stabilized only where needed. Existing controls retain their current behavior, and unused callback props will either be wired to their intended exit control or removed from the interface if no control consumes them.

### Home, Flashcard, and Vocabulary contracts

The Home statistics container will expose an actual `region` role with its existing accessible name. The daily mission keeps the established Thai label `ฝึกพูด` and its existing `#speak` action. Direct hash navigation will be isolated behind the existing navigation style in a lint-safe callback.

Flashcard training choices remain visually rendered by `OptionCard`, but each choice exposes `role="radio"`, `aria-checked`, and the established accessible name for review-forgot mode. The group will retain its existing selection behavior.

Vocabulary cards derive the displayed scenario from the first category and fall back to `scenarioThai` or `sourceScenario`; they never render a boolean.

### Profile and avatar work

The current profile layout is preserved. Derived statistics will use typed activity events, correct date arithmetic, and hook dependencies that reflect the values read. Avatar selection will validate supported image types and reasonable size before upload, use the authenticated user's folder, update the profile only after upload succeeds, and expose loading/error feedback. The migration and storage policies will be reviewed against existing Supabase conventions, including ownership checks for update and delete operations.

### Lint and formatting

Remove unused imports and variables, replace mutable locals with `const`, eliminate trailing whitespace, and make effects/callbacks satisfy React hook rules without disabling rules. The package lint scope remains unchanged unless verification proves it omits a required edited file; edited-file lint is an additional completion gate.

## Error Handling

- Local progress persistence remains the gate before learning-activity recording.
- Async conversation-data failures must leave a recoverable loading/error state rather than an unhandled rejection.
- Avatar upload and profile update failures retain the previous profile image and show a user-facing error.
- No repair silently swallows an error that existing tests expect to propagate.

## Testing and Verification

Each behavioral repair follows red-green verification using the already-failing regression test or a new minimal test when coverage is missing. Completion requires fresh evidence from:

1. Targeted Home, Flashcard, Vocabulary, Speak activity, player, profile, and profile-service tests.
2. `npm test` completing normally with zero failures and no unhandled errors.
3. `npm run build` completing successfully.
4. `npm run lint` completing with zero warnings or errors.
5. ESLint over every edited TypeScript/TSX file with zero warnings or errors.
6. `git diff --check` with no whitespace errors.
7. Browser smoke checks for Home, Flashcard setup, Speak completion/practice navigation, Vocabulary cards, and Profile/avatar states at desktop and mobile widths.

## Non-Goals

- Reverting the Tailwind migration or the current visual redesign.
- Changing product copy beyond restoring established contracts.
- Broad architecture refactors unrelated to reproduced failures.
- Committing or overwriting the user's in-progress source changes as part of the design-document commit.
