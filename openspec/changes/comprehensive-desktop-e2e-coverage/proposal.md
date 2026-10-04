# Proposal

## Why

The Cypress E2E suite currently consists of a single app-shell smoke spec (`cypress/e2e/app-shell.cy.ts`). The desktop app's real surface — image upload with EXIF parsing, gallery/list/map/investigation views, export/import, settings, theming, image comparison, and updater notifications — is only covered by Jest unit tests that exercise components in isolation, never the wired-up app in a real browser. Regressions that span components (upload → gallery → map marker → export) are invisible today.

## What Changes

- Add a shared E2E boot helper (`cypress/support/app.ts`) that installs the Tauri mock with the app's standard command set (app version, updater check, dialog/fs), plus custom Cypress commands, so every spec boots the app consistently.
- Add binary image fixtures under `cypress/fixtures/` generated with ImageMagick: a full-EXIF JPEG (GPS + camera metadata), a GPS-less JPEG, and a corrupt image — plus a small fixture-generation script and its documentation so fixtures are reproducible.
- Add specs covering:
  - **Upload & EXIF processing** (`upload.cy.ts`): file-input upload, drag-and-drop, non-image rejection, corrupt-file error state, multi-image handling.
  - **EXIF display** (`exif-display.cy.ts`): EXIF panel fields from real parsed fixtures, details/full-EXIF views, copy-to-clipboard.
  - **Views & navigation** (`views.cy.ts`): map/list/investigation switching, gallery collapse, empty-state affordances, help menu.
  - **Map** (`map.cy.ts`): map canvas renders, markers appear for GPS images, popup, route and heatmap toggles, layer/zoom controls, map error boundary.
  - **Investigation** (`investigation.cy.ts`): the four analysis views (device dendrogram, geographical, software processing, timeline) and stats sidebar render with data.
  - **Export** (`export-import.cy.ts`): CSV/JSON export through a stubbed `showSaveFilePicker`, export error path, KML/CSV import via file input, invalid-import error display.
  - **Settings** (`settings.cy.ts`): open/close, appearance theme toggle (persists `data-theme`), map settings toggles, about/version.
  - **Theming** (`theme.cy.ts`): `data-theme` attribute inversion, toggle persistence across reloads.
  - **Image comparison** (`comparison.cy.ts`): open from gallery, modal chrome, close.
  - **Updater** (`updater.cy.ts`): update-available notification from mocked `plugin:update|check`, dismiss behavior.
  - **Accessibility & responsive** (`a11y.cy.ts`): keyboard focus visibility, aria-labels on icon-only controls, mobile header menu at narrow viewports, reduced-motion media handling.
- Network-isolate the suite: `cy.intercept` for reverse-geocoding fetches so no real network traffic occurs.
- No application source changes unless a spec uncovers a genuine bug — bugs found are reported back, not papered over in tests.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `desktop-e2e-testing`: Extends the browser-based E2E capability from infrastructure + smoke test to comprehensive UI-flow coverage with controlled test data, network isolation, and per-flow specs.

## Impact

- **Code:** `apps/exif-hound-desktop` — new files under `cypress/` (support, fixtures, e2e specs) and a fixture-generation script under `scripts/`. No app source changes expected.
- **Dependencies:** none new (ImageMagick used locally to generate fixtures; the generated binaries are committed).
- **Systems:** suite stays fully offline (Tauri bridge mocked, geocoding intercepted).
- **Out of scope:** real Tauri IPC, component-testing mode, migrating Jest tests, CI pipeline changes.