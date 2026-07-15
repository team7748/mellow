# Remove Dark Mode Design

## Goal

Remove the appearance-theme menu and all Dark/System runtime behavior. Mellow must always render with its existing Light theme while preserving all other Profile settings and UI behavior.

## Scope

- Remove the theme selector from Profile settings.
- Remove the `AppTheme` and client-side `theme` preference fields.
- Stop reading, saving, caching, or applying a theme preference in React.
- Remove System color-scheme listeners and dark `data-theme` handling.
- Remove dark-theme CSS token overrides.
- Explicitly keep the document color scheme set to `light`.
- Update affected tests and documentation.

## Supabase Compatibility

Keep the existing `user_preferences.theme` database column and its migration definition. The frontend will no longer select, map, or update the column. This avoids a destructive database migration and remains compatible with projects where migration `006_profile_settings_and_reminders.sql` has already been applied.

Existing rows containing `dark` or `system` are harmless because the client ignores the value and always uses Light mode.

## Data Flow

`PreferencesProvider` continues to load and save learning goals, reminders, language, speech settings, and autoplay. Theme is removed from the application preference type, cache normalization, repository mapping, UI, and provider effects.

Supabase upserts omit `theme`, so PostgreSQL retains the existing database value without affecting the application.

## UI Behavior

The “ธีมการแสดงผล” field is removed completely. The remaining “ภาษาและการแสดงผล” section keeps the language selector without changing spacing or Profile layout. All surfaces use the existing Light design tokens.

## Verification

- Type normalization rejects no valid settings merely because a legacy cache contains `theme`.
- Profile settings no longer render a theme control or send theme updates.
- The document never receives `data-theme="dark"` and uses `color-scheme: light`.
- Build, TypeScript, lint, and the full test suite pass.
- Runtime smoke verifies Light colors and no console errors on Home and Profile/Auth routes.
