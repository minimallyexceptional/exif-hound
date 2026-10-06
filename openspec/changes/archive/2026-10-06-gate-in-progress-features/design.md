# Design: Gate in-progress features

## Context

The Investigation view is a lazy-loaded route reachable from the app header and mobile menu. All builds (including released production AppImages) currently expose it. There is no flag mechanism, and testing happens exclusively in development-mode builds, so any gating must default to visible in dev/test and hidden in production.

## Chosen approach

### Flag derivation (single place: vite.config.ts)

`__FEATURE_FLAGS__` becomes a build-time global, derived where `__DEV__`, `__APP_VERSION__`, and `__UPDATE_CHANNEL__` already live:

- `GATED_FEATURES = ['investigation']` — the registry of in-progress features, defined once in `vite.config.ts` alongside the other baked-in globals.
- Development/test builds (`process.env.NODE_ENV !== 'production'`) enable the whole registry (plus any env-listed extras).
- Production builds enable only the names in the `EXIFHOUND_FEATURES` environment variable (comma-separated). Default production build: no flags.
- `apps/exif-hound-desktop/turbo.json` adds `EXIFHOUND_FEATURES` to the `build` and `tauri:build` env passthrough, mirroring `EXIFHOUND_UPDATE_CHANNEL`.

### Runtime accessor (src/config/featureFlags.ts)

`isFeatureEnabled(feature: string)` reads the `__FEATURE_FLAGS__` global. TypeScript declares it in `vite-env.d.ts`; Jest shims it in `setupTests.ts` with the full registry so tests behave like dev builds. Callers import `isFeatureEnabled` directly — flags are build constants, not runtime state.

### Gating points

- `AppHeader.tsx`: wrap the desktop Investigation button and the mobile-menu Investigation button in `isFeatureEnabled('investigation')`.
- `App.tsx`: the `'investigation'` case in the view switch falls back to the map view when the flag is disabled (defensive; viewMode cannot be persisted today, but the guard makes impossible states harmless).
- `Investigation.tsx` stays lazy-loaded; hiding the entry points means the chunk is never fetched in production, though the file may still exist in `dist`.

### Settings star button

The About section in `Settings.tsx` already hosts "Check for Updates" (the update controls). Add a "Star on GitHub" button next to it using the same `openUrl` + `isTauriEnvironment` pattern as the mobile-menu action. Move the repository URL constant to `src/constants/github.ts` so header and settings share one source.

## Alternatives considered

- **Runtime flags (localStorage/remote config)**: rejected — the requirement is build-time exclusion from production releases; runtime flags leak and complicate testing.
- **Code-splitting investigation out of production via dynamic-only entry**: rejected as fragile; the lazy chunk is enough, and UI-level gating is the contract.
- **Per-feature env vars** (`EXIFHOUND_ENABLE_INVESTIGATION`): rejected — a single comma-separated variable scales better and keeps vite.config.ts the only registry.

## Risks

- A typo in `EXIFHOUND_FEATURES` silently enables nothing — acceptable for an operator-only escape hatch; the flag names are documented.
- Tests that assert the Investigation button exists keep passing because Jest and dev builds enable the registry.