# Tasks

## 1. Test data and shared boot infrastructure

- [ ] 1.1 Create `apps/exif-hound-desktop/scripts/generate-e2e-fixtures.sh` using ImageMagick to produce `cypress/fixtures/images/full-exif.jpg` (GPS + camera/exposure metadata), `no-gps.jpg`, `corrupt.jpg`, and `cypress/fixtures/import/points.kml`; verify embedded EXIF values with a exifreader one-liner and document expected constants in `cypress/fixtures/images/README.md`. Verify: running the script twice produces fixtures whose parsed EXIF matches the documented constants.
- [ ] 1.2 Create `cypress/support/app.ts` with `bootApp(options)`: installs the tauri mock, registers standard commands (`plugin:app|version`, updater check), stubs `window.showSaveFilePicker` (recording calls), and adds default geocoding intercepts plus an unmocked-external-host catch-all. Verify: TypeScript compiles and the smoke spec still passes using the helper.
- [ ] 1.3 Add `cypress/support/commands.ts` with reusable commands (upload fixture files, open/close settings, wait for map) and register them in `e2e.ts`; extend the uncaught-exception policy only as needed. Verify: `npm run typecheck` passes in the workspace.

## 2. Core flow specs

- [ ] 2.1 `cypress/e2e/upload.cy.ts`: file-input upload of full-exif + no-gps fixtures, multiple-file handling, non-image rejection, corrupt-file error state. Verify: passes headlessly.
- [ ] 2.2 `cypress/e2e/exif-display.cy.ts`: EXIF panel fields match fixture constants, details/full-EXIF views open, copy-to-clipboard works. Verify: passes headlessly.
- [ ] 2.3 `cypress/e2e/views.cy.ts`: map/list/investigation switching, gallery and EXIF-panel collapse, help menu, empty states with no images. Verify: passes headlessly.
- [ ] 2.4 `cypress/e2e/map.cy.ts`: markers only for GPS images, image popup, route and heatmap toggles, layer/zoom controls, map error boundary presence. Verify: passes headlessly.
- [ ] 2.5 `cypress/e2e/investigation.cy.ts`: device dendrogram, geographical, software-processing, timeline surfaces and stats sidebar render with fixture data; no console errors. Verify: passes headlessly.

## 3. Data, settings, and chrome specs

- [ ] 3.1 `cypress/e2e/export-import.cy.ts`: CSV/JSON export content via stubbed save picker, export error path, valid KML import shows points, invalid import error dismissible. Verify: passes headlessly.
- [ ] 3.2 `cypress/e2e/settings.cy.ts`: settings modal open/close, appearance/map/about sections, map toggles operable, version shown. Verify: passes headlessly.
- [ ] 3.3 `cypress/e2e/theme.cy.ts`: `data-theme` switch, token inversion (computed styles), persistence across reload. Verify: passes headlessly.
- [ ] 3.4 `cypress/e2e/comparison.cy.ts`: comparison modal opens from image UI, chrome renders, closes cleanly. Verify: passes headlessly.
- [ ] 3.5 `cypress/e2e/updater.cy.ts`: mocked update-available shows notification with version info; dismiss removes it. Verify: passes headlessly.

## 4. Accessibility, responsive, and full-run validation

- [ ] 4.1 `cypress/e2e/a11y.cy.ts`: keyboard focus visibility, aria-labels on icon-only controls, mobile header menu at narrow viewport with working actions. Verify: passes headlessly.
- [ ] 4.2 Full-suite headless run `npm run cy:run` from a clean state (no pre-running server): all specs pass or individual failures are diagnosed as app bugs and reported; artifacts stay gitignored (`git status` clean). Verify: run is green and `git status` clean.
- [ ] 4.3 Run `npm run typecheck`, `npm run lint`, existing `npm test` in the workspace; run `openspec validate --all`. Verify: all pass.
- [ ] 4.4 Update `apps/exif-hound-desktop` README testing section with the new spec layout and fixture regeneration instructions. Verify: instructions match scripts.