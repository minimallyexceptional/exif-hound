# EXIF Hound Desktop — agent guide

This document is the **single source of truth** for AI agents and contributors working on the desktop app and its relationship to the monorepo. Read it before changing runtime behavior, tests, or package boundaries.

The app lives at `apps/exif-hound-desktop`. The repository root is two levels up (`../..` from here). Shared logic belongs in `packages/*`, especially **`exif-hound-core`**.

---

## Product and stack

- **One desktop product** — no pro/community split. **Tauri 2 only** (no legacy desktop shell). Root `npm run scan:forbidden-desktop-apis` fails if forbidden preload/IPC patterns reappear.
- **UI:** React 19, Vite 7, Tailwind CSS 4, TypeScript.
- **Shell:** Tauri 2 (Rust in `src-tauri/`).
- **Maps:** Leaflet. **Charts:** visx where used.
- **Node:** `>= 20`. **Package manager:** npm workspaces (pinned in root `package.json`), orchestrated by Turborepo.
- **Update channel** is compile-time: `EXIFHOUND_UPDATE_CHANNEL` (`stable` | `beta` | `internal`) via Vite `define` in `vite.config.ts` — not `import.meta.env`.

---

## Architecture (non‑negotiable)

### Layering

```
React UI (this app)
    → exif-hound-core (facades, namespaces, geocoding, project/archive services)
        → middleware packages (domain implementations + injectable providers)
            → provider libraries (exifreader, OpenCV, WebView codec, PaddleOCR, …)
Web Workers: packages/exif-hound-core/src/workers/* (bundled via Vite ?worker&url)
Tauri IPC / Rust: src-tauri + thin adapters in core `platform/desktop/*`
```

**Canonical diagram:** `.archyify/architecture-exif-hound-desktop-20261014-114343/exif-hound-desktop-runtime.html` (see `.archyify/README.md` to regenerate).

### Rules agents must not break

1. **Desktop `src/` does not import middleware packages or `exifreader`.**  
   UI and hooks talk to **`exif-hound-core` only** (types, facades, geocoding helpers, Tauri ports).  
   Enforced by root: `npm run scan:domain-imports` (`scripts/scan-direct-domain-imports.js`).  
   **Allowlisted exception:** `src/core/archiveDbProvider.ts` (archive wiring).

2. **No duplicate domain logic in the app.** EXIF parsing, OCR, forensics, image processing, and workbench orchestration live in packages; core exposes **`ExifHoundCore`** and **`MiddlewareNamespace`**.

3. **Workers live in core, not under `apps/.../src/workers`.**  
   - EXIF: `exif-hound-core/workers/exif?worker&url` (see `src/hooks/useExifData.ts`).  
   - Image processing: configured in `src/core/bootstrap.ts` via `createDesktopCore({ imageProcessingWorkerUrl, getArchiveDbProvider })`.

4. **Symmetric middleware + provider ports.**  
   - `exif-middleware`: `ExifTagLoader`, `ExifMiddleware`, default `ExifReaderTagLoader`.  
   - `image-forensics-middleware`: metadata via loader port (`ExifTagLoaderMetadataReader`).  
   - Core: `ExifMiddlewareFacade`, `ImageForensicsMiddlewareFacade`, `ImageProcessingFacade`, optional `ReverseGeocodingProvider` (`configureReverseGeocodingProvider`).  
   New integrations **extend ports and facades**; do not bypass them from React.

5. **Bootstrap once.** `bootstrapCore()` in `src/core/bootstrap.ts` creates the core singleton. React receives it through **`CoreProvider`** / **`useCore()`** (`src/core/CoreContext.tsx`). Prefer `useCore().middleware.exif` (etc.) over static imports of middleware functions in components.

6. **Build order.** Middleware packages produce `dist/`; desktop Vite aliases core workers and depends on built packages. From repo root: `npm run dev:packages` or `npm run build:packages` before `npm run tauri:dev` when package APIs change.

7. **Jest / Playwright:** application source must **not** use `import.meta`. Use globals `__DEV__` and `__UPDATE_CHANNEL__` from Vite `define`.

---

## TDD and quality posture

We treat tests and architecture as part of the feature, not an afterthought.

### Default workflow

1. **Clarify behavior** (bug: reproduce with a failing test; feature: OpenSpec first — see below).
2. **Write or update the test** that encodes the contract (unit in the owning package or desktop `src/**/__tests__/`).
3. **Implement the smallest change** that passes without weakening boundaries.
4. **Run the relevant gates** locally before claiming done.

### Where tests live

| Layer | Location | Runner |
|--------|-----------|--------|
| Middleware packages | `packages/*/tests/` | `npm test --workspace=<package>` |
| Core facades, geocoding, project logic | `packages/exif-hound-core/tests/` | `npm test --workspace=exif-hound-core` |
| Desktop UI & hooks | `src/**/__tests__/` | `npm test --workspace=exif-hound-desktop` |
| Performance-sensitive desktop | `src/__tests__/performance/` | same Jest config |
| Release scripts | `scripts/**/__tests__/` | `npm run test:scripts` (repo root) |
| Full product flows | `playwright/e2e/` | `npm run test:e2e` (repo root) |

Root **`npm test`** runs Jest for **all workspaces** that define a `test` script.

### Definitions of done (agents)

- Behavior change → **test updated or added** in the **owning layer** (middleware test for loader port changes; core test for facade wiring; desktop test only for UI-specific behavior).
- **No forbidden imports**; run `npm run scan:domain-imports` when touching desktop imports.
- **Lint + typecheck** for desktop: `npm run lint --workspace=exif-hound-desktop`, `npm run typecheck --workspace=exif-hound-desktop`.
- **Deterministic tests** — no real network in unit tests; mock Tauri, Nominatim, and tiles in Playwright (see below).
- Do **not** delete or skip tests to green CI. Do **not** bypass Husky except in rare emergencies (`--no-verify` + immediate follow-up fix).

### Pre-commit (Husky)

`.husky/pre-commit` at repo root runs on every commit:

- Desktop ESLint and typecheck  
- Desktop Jest (`--runInBand`)  
- Jest for all listed **packages**  
- Desktop production **Vite build**  

E2E is **not** in pre-commit; CI runs Playwright in a separate job. Keep commits passing the hook — it is intentionally slow.

### CI (GitHub Actions)

- **tests job:** typecheck desktop + `npm test` (monorepo Jest) + `test:scripts`  
- **playwright job:** `build:packages` + full E2E suite  

---

## Commands (from repository root)

```bash
npm install
npm run dev:packages              # watch/build packages
npm run tauri:dev                 # desktop dev (Tauri + Vite)
npm run tauri:build               # release build (host platform only)
npm run lint                      # turbo lint (all workspaces)
npm run typecheck                 # turbo typecheck
npm test                          # Jest — all workspaces
npm test --workspace=exif-hound-desktop -- --runInBand   # desktop only
npm run test:e2e                  # Playwright (desktop)
npm run scan:domain-imports       # architecture import guard
npm run scan:forbidden-desktop-apis   # legacy shell API guard
npm run build:packages && npm run build:apps
```

Desktop-only shortcuts (from `apps/exif-hound-desktop`): `npm run dev:test` (Playwright Vite server), `npm run test:e2e:ui`.

---

## Unit testing (Jest)

- **Config:** `jest.config.cjs`; setup: `src/setupTests.ts`.
- **Module aliases:** core workers mapped to `packages/exif-hound-core/src/workers/*` for tests.
- Prefer testing **facades and hooks** with injected ports/mocks rather than full UI trees when possible.
- Core exposes test hooks where needed (e.g. `resetCoreForTests`, `configureReverseGeocodingProvider(null)`, `__resetImageProcessingMiddlewareForTests`).

---

## E2E testing (Playwright)

- **Config:** `playwright.config.ts`; specs: `playwright/e2e/` (upload, EXIF, views, map, investigation, export/import, settings, theme, comparison, updater, shell, a11y).
- Serves real UI via **`dev:test`** at `http://127.0.0.1:5276` — not a Tauri binary.
- **Boot helper:** `playwright/support/app.ts` — `bootApp(page, { commands, geocoding, localStorage })`. Mocks `__TAURI__` / IPC before load. **Unknown Tauri commands reject** — register every command the path invokes.
- **Fixtures:** generated by `scripts/generate-e2e-fixtures.mjs`; constants in `playwright/fixtures/images/README.md`. Regenerate binaries; do not hand-edit.
- Viewport **1600×900**; target desktop layout (`lg`+).
- One-time: `npx playwright install chromium`.

---

## UI and styling

- **Tokens:** CSS variables in `src/index.css` (`:root`, `:root[data-theme="light"]`). Toggle `data-theme`; use utilities like `text-app-accent`, `bg-app-gray` — no hardcoded palette in components.
- **Selection:** `body { user-select: none }`. EXIF/metadata **values** users should copy use class **`selectable-value`** (see `ExifDetailsView`, `FullExifView`, `ImagePopup`). Inputs/textareas stay selectable.
- **Motion:** respect `prefers-reduced-motion` in `index.css`.
- **Map reticle:** default **off** (`showReticle` initial `false` in `src/components/Map/index.tsx`).

---

## OpenSpec (new features)

New **product features** require OpenSpec before implementation:

1. From repo root: `openspec new change <name> --description "..."`
2. Proposal/requirements/design → **user approval**
3. Generate tasks from spec; implement against tasks
4. `openspec validate --all` before complete; archive the change

**Exceptions:** bug fixes, deps/security, docs-only, maintenance — unless they expand behavior materially.

Artifacts: `openspec/changes/` (active), `openspec/changes/archive/`, capabilities in `openspec/specs/`. Historical Cypress OpenSpec is archived; **Playwright** is the E2E standard (this file + `README.md`).

---

## Package map (reference)

Each package under `packages/` has its own **`AGENTS.md`** (TDD posture, boundaries, symmetric middleware rules).

| Package | Role |
|---------|------|
| `exif-hound-core` | App-facing API: core singleton, middleware facades, geocoding, project/archive/workbench/evidence/updater |
| `exif-middleware` | EXIF extraction + `ExifTagLoader` port (canonical middleware shape) |
| `image-processing-middleware` | Raster/OpenCV pipeline |
| `image-forensics-middleware` | Forensics; EXIF metadata reader via loader port |
| `ocr-middleware` | PaddleOCR integration |
| `investigation-archive` | Archive DB / evidence storage |
| `workbench-workflow` | Workbench flow engine |

Desktop **`package.json`** depends on **`exif-hound-core`**, not individual middleware packages (except what core re-exports for types).

---

## Turborepo note

Monorepo task graph is in root `turbo.json`; desktop overrides in `turbo.json` here. Before changing Turbo behavior, read the **installed** `turbo` package docs (`node -p "require.resolve('turbo/package.json')"` from a workspace that depends on turbo). Root agent guidance from Turbo is disabled (`agentGuidance: false`) so this file remains authoritative for desktop work.
