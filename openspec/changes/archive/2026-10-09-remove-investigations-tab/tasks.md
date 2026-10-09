# Tasks

## 1. Remove the Investigation surface

- [x] 1.1 Remove Investigation navigation, view state, rendering, and selected-tool persistence; verify the app only exposes Map, List, and Workbench and old `investigation` sessions open in Workbench.
- [x] 1.2 Delete the dashboard and analysis components and `exif-insights` package; verify no Workbench imports or package references point to removed files.
- [x] 1.3 Remove `exif-insights` from app dependencies, lockfile, Vite aliases and dependency optimization; verify package build graph resolves without it.
- [x] 1.4 Remove feature-flag plumbing and docs because no feature remains gated; verify no `EXIFHOUND_FEATURES`, `__FEATURE_FLAGS__`, or Investigation feature-flag references remain in active code or contributor docs.

## 2. Preserve project compatibility and verify integration

- [x] 2.1 Update archive/session restoration tests to cover a legacy Investigation view mapping to Workbench and verify existing database formats remain readable.
- [x] 2.2 Update desktop navigation, app, and Workbench tests to verify the Investigation entry and dashboard are absent while Workbench project workflows remain available.
- [x] 2.3 Build shared packages and desktop app, run desktop unit tests and Playwright E2E, then run `openspec validate --all` and verify no unrelated tracked files changed.

## Workflow follow-up

- Archive this change after implementation and validation.
