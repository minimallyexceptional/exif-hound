# Tasks

## 1. Install Cypress and add configuration

- [x] 1.1 Add `cypress` as a devDependency of `apps/exif-hound-desktop` and run `npm install` at the repo root. Verify: `npx cypress version` inside the workspace prints a version.
- [x] 1.2 Create `apps/exif-hound-desktop/cypress.config.ts` with `e2e.baseUrl` = `http://localhost:5176`, `specPattern` = `cypress/e2e/**/*.cy.ts`, support/scripts file wiring, and a `setupNodeEvents` that enables screenshots. Verify: `npx cypress open` (or `cypress verify`) loads the config without errors.
- [x] 1.3 Add `cypress/support/e2e.ts` (global setup, uncaught-exception policy) and `cypress/support/tauri-mock.ts` exposing `installTauriMock(win)` plus a `registerCommand` registry for canned `invoke` responses. Verify: TypeScript compiles (`npm run typecheck`).
- [x] 1.4 Add npm scripts `cy:open` and `cy:run` to `apps/exif-hound-desktop/package.json`; `cy:run` starts the Vite dev server via Cypress `start`/`start-ready` config so it works with no server pre-running. Verify: `npm run cy:run` boots a server, runs specs, and exits non-zero on failure.
- [x] 1.5 Add `cypress/videos`, `cypress/screenshots`, `cypress/downloads` to `.gitignore`. Verify: `git status` stays clean after a headless run.

## 2. Smoke spec proving the runner and the Tauri mock

- [x] 2.1 Create `cypress/e2e/app-shell.cy.ts`: visit `/` with `onBeforeLoad` installing the Tauri mock, assert the main UI shell (app frame + navigation) renders, and assert one mocked command path responds with registered canned data. Verify: spec passes in headless mode.

## 3. Turborepo integration

- [x] 3.1 Add a `test:e2e` task to `apps/exif-hound-desktop/turbo.json` (no cache) and to the root `turbo.json` task graph. Verify: `turbo run test:e2e --filter=exif-hound-desktop` runs the headless suite.
- [x] 3.2 Update `apps/exif-hound-desktop/README.md` (or testing section) with how to run Cypress locally. Verify: instructions match the added scripts.

## 4. Validation and archive

- [x] 4.1 Run `npm run typecheck`, `npm run lint`, and existing `npm test` in the workspace to confirm nothing regressed; run `openspec validate --all` and fix any reported issues. Verify: all pass.
- [x] 4.2 Archive the change with `openspec archive setup-cypress-desktop`. Verify: change no longer appears in `openspec list`.
