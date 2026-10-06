# Proposal

## Why

The Investigation view is in-progress work that is not ready for end users, but it currently ships in every production build. There is also no standardized mechanism for keeping incomplete features out of released builds, so every such feature would need ad-hoc gating. Separately, the "Star on GitHub" action exists in the mobile menu only; the Settings About section (which holds the update controls) has no repository link, even though it is where desktop users look for support actions.

## What Changes

- Add a build-time feature-flag mechanism: a `__FEATURE_FLAGS__` global derived in Vite config. In-progress features are enabled automatically in development and test builds; production builds include a flag only when it is explicitly enabled via the `EXIFHOUND_FEATURES` environment variable (comma-separated flag names).
- Gate the Investigation view behind the first flag (`investigation`): the header button, the mobile-menu entry, and the view itself are only rendered when the flag is enabled, so released production builds never expose it.
- Add a "Star on GitHub" button to the Settings About section, directly below the update controls, opening the repository through the same URL-opening mechanism as the existing mobile-menu action.
- Document the flag mechanism for future feature work.

## Capabilities

### New Capabilities

- `feature-flags`: Build-time gating of in-progress features so they render in development and test builds but stay out of production builds unless explicitly enabled.

### Modified Capabilities

- `github-support-link`: Adds a Settings About-section "Star on GitHub" action alongside the existing mobile-menu action.

## Impact

- `apps/exif-hound-desktop/vite.config.ts` (flag derivation), `src/config/featureFlags.ts` (new), `src/vite-env.d.ts`, `src/setupTests.ts`, `apps/exif-hound-desktop/turbo.json` (env passthrough).
- `src/components/AppHeader.tsx` and `src/App.tsx` (investigation gating).
- `src/components/Settings.tsx` (star button).
- `docs/` or feature-flag documentation for future contributors.
- Released production builds no longer show the Investigation tab.