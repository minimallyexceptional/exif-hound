# Design

## Context

`exif-hound-desktop` is a Tauri 2 app whose frontend is a Vite + React 19 SPA served on port 5176 (`dev` script). The frontend already guards on Tauri availability: `main.tsx` logs `!!window.__TAURI__` and `TauriProvider` branches on it, while all native access goes through `@tauri-apps/api` `invoke` and `@tauri-apps/plugin-*` packages. Existing tests are Jest/jsdom unit tests (`jest.config.cjs`). The workspace is an npm-workspaces monorepo driven by Turborepo; the desktop app has its own `turbo.json`.

## Goals / Non-Goals

**Goals**
- Run the real UI in a real Chromium/Electron browser with DOM interactions Cypress can drive.
- Keep the loop fast: no Rust build, no Tauri window; tests run against the Vite dev server.
- Make Tauri-dependent behavior testable by stubbing the bridge before app code executes.
- Integrate with the existing Turborepo task graph.

**Non-Goals**
- Driving a compiled Tauri binary or real IPC (no `tauri-driver`).
- Component-testing mode (Cypress CT) — Jest already covers component tests.
- Replacing or migrating Jest tests.
- CI pipeline changes (scripts are CI-ready but no CI file is modified in this change).

## Decisions

1. **E2E against a dedicated Vite dev server, not a production build.** Cypress `e2e.baseUrl` = `http://localhost:5276`; `cy:run`/`cy:open` use `start-server-and-test` to boot a `dev:test` script (`vite --port 5276 --strictPort`) before Cypress starts. Rationale: zero extra build tooling, and a strict, dedicated port guarantees E2E never runs against a stale or different-checkout server that happens to occupy 5176 (observed in practice). Alternative considered: reusing the shared 5176 `dev` server — rejected because Vite's `strictPort: false` silently falls back to other ports, making the test target ambiguous. `@cypress/vite-dev-server` was also rejected as unnecessary weight for a single Vite app.

2. **Mock the Tauri bridge in `cy.visit` `onBeforeLoad`.** A `cypress/support/tauri-mock.ts` helper installs `window.__TAURI__`, `window.__TAURI_IPC__`, and minimal `invoke` handling into the AUT window before the bundle executes, with a per-test registry of canned command responses (`registerCommand(name, payload)`). Rationale: the app checks `window.__TAURI__` synchronously at boot, so the stub must exist before any app script runs; `onBeforeLoad` guarantees that. Alternative considered: stubbing ES modules via Vite aliases — rejected because it diverges from the production import path and the runtime bridge check already provides the seam.

3. **Cypress 14 with ESM `cypress.config.ts`.** The app is `"type": "module"`, so the config is a TS module loaded by Cypress's own bundler; no CommonJS shims needed.

4. **Turborepo integration.** Add a `test:e2e` task in the desktop app's `turbo.json` (depends on nothing; the dev server is managed by Cypress itself) and in the root `turbo.json` pipeline so `turbo run test:e2e --filter=exif-hound-desktop` works. `cy:open` stays a local, non-turbo convenience script.

5. **Smoke spec first.** `cypress/e2e/app-shell.cy.ts` asserts the app frame renders and a Tauri-invoking surface (e.g. settings load) responds with mocked data. This proves both the runner and the bridge mock in one spec; deeper specs follow later, outside this change.

## Risks / Trade-offs

- [App reads `window.__TAURI__` before `onBeforeLoad` runs in edge cases (StrictMode double-mount timing)] → the mock is installed via `onBeforeLoad`, which runs before any bundle script; verified by the smoke spec.
- [Cypress's bundled Electron lacks WebUSB/file-dialog behavior] → dialog plugin calls are stubbed in the mock registry; native-only flows are out of scope per proposal.
- [Cypress's bundled Electron hangs on failure screenshots in some Linux desktop environments] → passing runs are unaffected (no screenshots are taken); on affected machines developers debug with `npm run cy:run -- --browser chromium`, which screenshots correctly.
- [Large first-install download (Cypress binary)] → accepted; it is a devDependency and CI installs once with cache.
- [Port 5176 conflicts with a manually running `dev` session] → avoided entirely: E2E uses its own port (5276) with `--strictPort`, so it never reuses or races with a developer's dev server.

## Migration Plan

Purely additive: install dependency, add config + support files + scripts + turbo task. Rollback = remove the added files and the devDependency. No existing test or build path is modified.

## Open Questions

None.
