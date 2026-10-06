# Tasks

## 1. Feature flag mechanism

- [x] 1.1 Add `__FEATURE_FLAGS__` to `vite.config.ts` (registry `GATED_FEATURES = ['investigation']`; dev/test builds enable the registry, production builds enable only `EXIFHOUND_FEATURES` entries) and pass `EXIFHOUND_FEATURES` through `turbo.json` build/tauri:build env.
- [x] 1.2 Add `src/config/featureFlags.ts` with `isFeatureEnabled`, declare `__FEATURE_FLAGS__` in `vite-env.d.ts`, shim it in `setupTests.ts` with the registry enabled.
- [x] 1.3 Gate Investigation: header button, mobile-menu entry, and the App view switch fallback; verify dev builds still show Investigation and a simulated production build (no flags) does not.

## 2. Settings star button

- [x] 2.1 Move the repository URL to `src/constants/github.ts`; add a "Star on GitHub" button in the Settings About section below the update controls using the shared `openUrl`/`isTauriEnvironment` pattern; verify header/mobile-menu behavior is unchanged.

## 3. Verification and release

- [x] 3.1 Run the desktop quality gates (lint, typecheck, Jest, E2E through the Husky hook) and `openspec validate --all`; commit and push to `main`.
- [x] 3.2 Bump the version to 2.6.4 with the single-edit flow (`tauri.conf.json` + `npm run release:version`), commit, push, tag `v2.6.4`, and verify the release pipeline completes: release published, manifest URLs live, Investigation absent from the production bundle behavior.