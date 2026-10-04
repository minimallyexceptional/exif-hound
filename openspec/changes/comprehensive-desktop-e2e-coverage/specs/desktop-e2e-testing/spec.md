# desktop-e2e-testing Specification

## MODIFIED Requirements

### Requirement: E2E runner boots the app with a mocked Tauri bridge

The E2E setup MUST provide a reusable boot helper that, before the application loads, installs the Tauri bridge mock with the app's standard command registrations (app version, updater check result, dialog/fs behavior) and stubs `window.showSaveFilePicker` for export flows. Every spec MUST boot the app through this helper so environment setup cannot drift between specs. Reverse-geocoding HTTP requests MUST be intercepted so the suite makes no real network calls.

#### Scenario: App renders in the Cypress browser

- **WHEN** the E2E suite visits the app URL served by the Vite dev server
- **THEN** the application boots without native Tauri APIs and the main UI shell (app frame, sidebar/navigation, primary content area) is visible

#### Scenario: Mocked commands return controlled data

- **WHEN** the app invokes a Tauri command through the mocked bridge during an E2E test
- **THEN** it receives the canned response registered for that command instead of touching the filesystem, process, or updater plugins

#### Scenario: Standard boot registers the app's native command set

- **WHEN** a spec boots the app through the shared boot helper without extra configuration
- **THEN** the app initializes with mocked responses for the commands it invokes at startup and during user flows (app version, updater check), and no `[tauri-mock]` unknown-command rejection occurs during those flows

#### Scenario: No real network traffic

- **WHEN** any spec exercises flows that trigger reverse geocoding or other external HTTP calls
- **THEN** those requests are fulfilled by `cy.intercept` stubs and no request leaves the test browser

### Requirement: Test data comes from real EXIF-bearing image fixtures

The suite MUST use committed binary image fixtures with genuine EXIF metadata (parsed by the app's real worker + exifreader path), including at minimum: a full-EXIF JPEG with GPS coordinates and camera metadata, a JPEG without GPS EXIF, and a corrupt/non-image file for error paths. Fixture generation MUST be scripted and reproducible.

#### Scenario: Full-EXIF fixture drives metadata-dependent UI

- **WHEN** the full-EXIF fixture is uploaded in a spec
- **THEN** the app parses camera make/model, capture date, exposure settings, and GPS coordinates that match the fixture's embedded metadata, and metadata-dependent UI (EXIF panel, map markers, investigation views) reflects that data

#### Scenario: Missing-GPS and corrupt fixtures drive edge cases

- **WHEN** the GPS-less fixture is uploaded
- **THEN** the image is accepted and displayed but produces no map marker and no GPS-derived UI
- **WHEN** the corrupt fixture is uploaded
- **THEN** the app surfaces a visible error state rather than crashing

## ADDED Requirements

### Requirement: Upload flow is verified end to end

The suite MUST verify the image upload path: selecting files through the file input, drag-and-drop, rejection of non-image files, and handling of multiple files.

#### Scenario: File-input upload

- **WHEN** a user selects image fixture(s) through the header upload input
- **THEN** each accepted image appears in the gallery, becomes the selected image, and its EXIF data populates the EXIF panel

#### Scenario: Non-image files are rejected

- **WHEN** a file whose type is not an image is selected
- **THEN** no new image entry is added to the gallery

### Requirement: EXIF data display is verified

The suite MUST verify the EXIF panel, the detailed EXIF views, and clipboard copy behavior against fixture data.

#### Scenario: EXIF panel renders parsed metadata

- **WHEN** an image with full EXIF is selected
- **THEN** the EXIF panel shows camera, exposure, and GPS-derived fields matching the fixture metadata

#### Scenario: Copy to clipboard

- **WHEN** the copy-to-clipboard control is used
- **THEN** the clipboard receives EXIF content (asserted via browser clipboard permission/intercept) and a confirmation is shown if the app provides one

### Requirement: View switching and navigation are verified

The suite MUST verify switching between map, list, and investigation views, gallery and EXIF-panel collapse controls, the help menu, and empty-state behavior before any images are loaded.

#### Scenario: View switching

- **WHEN** the user switches between map, list, and investigation views
- **THEN** only the selected view's primary content is displayed and the control reflects the active view

#### Scenario: Empty states

- **WHEN** no images have been uploaded
- **THEN** each view presents its empty-state affordance pointing the user to upload

### Requirement: Map behavior is verified

The suite MUST verify the map view with GPS-bearing images: map canvas renders, markers/clusters appear for GPS images and not for GPS-less images, the image popup opens, route and heatmap toggles update the map, and map layer/zoom controls function.

#### Scenario: Markers follow GPS data

- **WHEN** images with and without GPS are loaded and the map view is shown
- **THEN** exactly the GPS-bearing images produce map markers

#### Scenario: Route and heatmap toggles

- **WHEN** the route toggle and heatmap toggle are activated with GPS images present
- **THEN** the corresponding map layers activate and the toggle state is visually reflected

### Requirement: Investigation analysis views are verified

The suite MUST verify that the investigation view renders its analysis surfaces (device dendrogram, geographical analysis, software processing analysis, timeline analysis, and stats sidebar) without errors when images with known metadata are loaded.

#### Scenario: Investigation views render with data

- **WHEN** the investigation view is opened with fixture images loaded
- **THEN** each analysis surface renders (visibly, with content) and the console shows no application errors

### Requirement: Export and import flows are verified

The suite MUST verify exporting loaded images to CSV and JSON through a stubbed `showSaveFilePicker` (asserting the proposed filename, MIME type, and written content), the export failure path, and importing KML/CSV through the import modal's file input, including the invalid-file error state.

#### Scenario: CSV/JSON export writes generated content

- **WHEN** the user exports loaded images as CSV and as JSON
- **THEN** the stubbed save picker receives the correct file type and the written content contains rows/entries for the loaded images

#### Scenario: Import with valid and invalid files

- **WHEN** a valid KML fixture is imported through the import modal
- **THEN** imported points appear in the app's data display
- **WHEN** an invalid file is imported
- **THEN** the import error is surfaced to the user and can be dismissed

### Requirement: Settings and theming are verified

The suite MUST verify the settings modal (open/close, appearance section, map settings toggles, about/version), and the theme mechanism: toggling the theme MUST switch the `data-theme` attribute on `<html>`, invert the design-token values, and persist across page reloads.

#### Scenario: Theme toggle switches and persists

- **WHEN** the user toggles the theme and reloads the page
- **THEN** the `data-theme` attribute and computed token colors remain on the chosen theme

#### Scenario: Settings content

- **WHEN** the settings modal is opened
- **THEN** appearance, map settings, and about/version sections render, and map setting toggles can be operated

### Requirement: Image comparison is verified

The suite MUST verify opening the image comparison flow from the image UI, the comparison modal chrome, and closing it.

#### Scenario: Comparison modal opens and closes

- **WHEN** the user invokes compare on an image and then closes the modal
- **THEN** the comparison modal appears over the app and is fully removed after close

### Requirement: Updater notifications are verified

The suite MUST verify the update notification flow using the mocked updater check: a mocked "update available" result shows the notification, and dismissing/declining it removes it without side effects.

#### Scenario: Update available notification

- **WHEN** the mocked updater check resolves with an available update
- **THEN** the update notification UI appears with version information and can be dismissed

### Requirement: Accessibility and responsive behavior are verified

The suite MUST verify the app's accessibility floor and responsive layout: keyboard focus visibility on interactive controls, aria-labels on icon-only controls, the mobile header menu at narrow viewports, and that interactive controls remain reachable/operable at 1600x900 and at a narrow mobile-class viewport.

#### Scenario: Focus and labels

- **WHEN** tabbing through header controls
- **THEN** focus remains visible (a visible outline/ring is applied) and every icon-only control exposes an accessible name

#### Scenario: Mobile viewport menu

- **WHEN** the viewport is narrowed below the desktop breakpoint
- **THEN** the header collapses to a menu control that opens the mobile navigation and its actions work

### Requirement: Failures produce reviewable artifacts

The expanded suite MUST remain runnable via the existing `cy:run`/`cy:open` scripts with no manual preconditions, start its own dev server, exit non-zero on any failure, and keep producing screenshots for failures while excluding artifacts from version control.

#### Scenario: Full headless run

- **WHEN** `npm run cy:run` is executed with no pre-running dev server
- **THEN** all specs execute headlessly, the run is network-isolated, and the command exits non-zero if any spec fails