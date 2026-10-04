# Spec Delta

## Purpose
Covers browser-based end-to-end verification of the desktop app UI: a Cypress runner serves the app from the Vite dev server with the Tauri bridge mocked, so UI behavior can be validated without building or launching the native shell.

## ADDED Requirements

### Requirement: E2E runner boots the app with a mocked Tauri bridge
The E2E setup MUST provide a mock of the Tauri bridge (`window.__TAURI__`, `window.__TAURI_IPC__`, and invoked commands) before the application loads, so the app initializes in "Tauri available" mode inside the Cypress browser.

#### Scenario: App renders in the Cypress browser
- **WHEN** the E2E suite visits the app URL served by the Vite dev server
- **THEN** the application boots without native Tauri APIs and the main UI shell (app frame, sidebar/navigation, primary content area) is visible

#### Scenario: Mocked commands return controlled data
- **WHEN** the app invokes a Tauri command through the mocked bridge during an E2E test
- **THEN** it receives the canned response registered for that command instead of touching the filesystem, process, or updater plugins

### Requirement: E2E tests run headless and interactively via npm scripts
The desktop workspace MUST expose npm scripts that launch Cypress in headless run mode (`cy:run`) and interactive open mode (`cy:open`), and `cy:run` MUST start the Vite dev server itself when it is not already running.

#### Scenario: Headless run without a pre-running dev server
- **WHEN** `npm run cy:run` is executed in `apps/exif-hound-desktop` with no dev server already listening
- **THEN** the Vite dev server is started on its configured port, all E2E specs execute headlessly, and the command exits non-zero if any spec fails

#### Scenario: Interactive mode for authoring
- **WHEN** `npm run cy:open` is executed
- **THEN** the Cypress launcher opens against the same configuration, reusing a dev server if one is already running

### Requirement: Failures produce reviewable artifacts
The E2E setup MUST capture screenshots of failing tests by default, and MUST NOT commit recorded videos or screenshots to version control.

#### Scenario: Failing spec leaves evidence
- **WHEN** an E2E spec fails during a headless run
- **THEN** a screenshot of the failure state is written to the Cypress artifacts directory and the run reports the failure

#### Scenario: Artifacts stay out of version control
- **WHEN** Cypress writes videos, screenshots, or downloaded fixtures
- **THEN** those paths are excluded by the repository/workspace `.gitignore` rules
