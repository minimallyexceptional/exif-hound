# Proposal

## Why

The desktop app (`exif-hound-desktop`) currently has only unit/component tests (Jest + Testing Library) and no end-to-end coverage. The UI renders and behaves differently in a real browser context (routing-free React app with Leaflet maps, virtualized lists, drag-drop, and Tauri-dependent code paths), and regressions there are invisible to Jest. Cypress gives fast, browser-based E2E and component-style verification of the app's UI against the Vite dev server, with Tauri bridge behavior stubbed so tests run in plain Chromium without building the Rust shell.

## What Changes

- Add Cypress as a devDependency of `apps/exif-hound-desktop` (v14, ESM-compatible setup).
- Add `cypress.config.ts` configured with:
  - `e2e` support file that stubs `window.__TAURI__` / `window.__TAURI_IPC__` and `@tauri-apps/*` plugin APIs before the app loads, so the app boots in "Tauri available" mode under Cypress.
  - `baseUrl` pointing at a dedicated Vite dev server instance (`http://localhost:5276`), started via a new `dev:test` script (`vite --port 5276 --strictPort`) so E2E runs never collide with a manually running `dev` session on 5176; `cy:run` starts it automatically (`start-server-and-test`).
- Add `cypress/e2e/` directory with a first smoke spec that mounts the app and asserts the main UI shell renders.
- Add npm scripts: `cy:open` (interactive), `cy:run` (headless), and a `cy:start` helper so `cy:run` can start the Vite server itself (`start-on-ci`-style) via Cypress `devServer`-free `start` config for CI friendliness.
- Add `.gitignore` entries for `cypress/videos`, `cypress/screenshots`, and `cypress/downloads`.
- Add a `test:e2e` task to the workspace `turbo.json` so `turbo run test:e2e` works across the monorepo.
- No application source code changes; no changes to existing Jest tests.

## Capabilities

### New Capabilities
- `desktop-e2e-testing`: The desktop app can be verified end-to-end in a real browser: a Cypress runner boots the app with the Tauri bridge mocked, exercises the UI shell and primary user flows, and reports pass/fail with artifacts (screenshots/videos) on failure.

### Modified Capabilities
<!-- none -->

## Impact

- **Code:** `apps/exif-hound-desktop` — new files under `cypress/`, one new `cypress.config.ts`, package.json scripts; optional `turbo.json` task addition at workspace/app level.
- **Dependencies:** adds `cypress` (devDependency, ~large binary download on first install), plus `@cypress/webpack-preprocessor` is NOT needed (Vite dev server is used directly, no bundling changes).
- **Systems:** CI (if configured later) will need a headless browser (Cypress bundles Electron by default); no backend or Tauri build changes.
- **Out of scope:** running Cypress against a compiled Tauri binary (real IPC), Tauri driver plugins, and migrating existing Jest tests.
