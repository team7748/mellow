# Project Cleanup Plan

## Scope

Remove only repository files and code with verified zero runtime references. Preserve UI behavior, routes, data, Supabase/Auth, tests, and build tooling.

## Safeguards

- Treat all existing working-tree changes and untracked user files as user-owned until reference checks prove they are disposable.
- Check static imports, lazy imports, dynamic asset paths, CSV/JSON paths, config/scripts, tests, and case-sensitive paths before removal.
- Keep ambiguous files and report them for follow-up instead of guessing.

## Cleanup candidates

- Remove obsolete implementation plans/specs and temporary audit notes that are not runtime documentation.
- Remove the ignored backup PostCSS config, temporary logs/search outputs, and generated build output after verification.
- Remove confirmed-unused components, imports, and CSS utilities.
- Remove legacy image assets with no runtime reference; retain all referenced learning data and active assets.
- Do not change package dependencies unless usage is conclusively absent and not required by build tooling.

## Verification

- Run the package scripts that exist: lint, build, and test.
- Run TypeScript/build checks and inspect the final diff/status.
- Smoke-test the Home, Speak, and primary navigation routes after cleanup.
