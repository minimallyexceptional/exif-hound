# Proposal

## Why

Investigations today vanish when the app closes: images and extracted metadata exist only in memory, so an OSINT/photography workflow cannot span sessions. Users need to save an investigation to a file of their choosing and resume it later with the app in exactly the state they left it. This also finally gives the splash screen's "Recent investigations" region real, resumable data.

## What Changes

- **New package `packages/investigation-archive`** — all archive/domain logic lives here (OOP service, dependency-inverted ports for the SQL engine and zip codec), testable in isolation with Jest following red-green-refactor TDD. The desktop app only wires UI + file I/O to it (mirroring how `exif-middleware` is consumed).
- **Archive format (`.investigation`)** — a zip container with:
  - `investigation.json` — manifest: format version, investigation name, timestamps, image count.
  - `investigation.db` — SQLite database with all extracted metadata (per-image EXIF JSON, file mapping, investigation meta).
  - `images/…` — the uploaded images bit-identical (original bytes preserved).
- **Save button in the app header** (enabled when ≥ 1 image is loaded): opens a native save dialog, writes the `.investigation` file, records it in recent investigations.
- **Splash screen gains an "Open investigation…" button** and a populated recent investigations list: entries are resumable — activating one re-opens that file and restores the session (images + extracted metadata; no re-extraction of EXIF).
- **Recent investigations tracking** — saved/opened file paths are tracked (localStorage), capped at 10, most-recent-first; the splash list shows name + relative time and resumes on click.
- **Tauri capability change** — `fs:allow-read-file` / `fs:allow-write-file` permissions added (dialog + fs plugins are already registered) so the app can write/read user-chosen files.
- Everything else downstream of entry remains untouched: saving/opening an investigation must not change any existing view behavior.

## Capabilities

### New Capabilities
- `investigation-persistence`: The `.investigation` archive format, the save action in the app, and the open/restore pipeline (in-memory state reconstruction), including the dedicated logic package.

### Modified Capabilities
- `splash-entrypoint`: The recent investigations region becomes a resumable, populated list backed by tracked save-file history, and gains an "Open investigation…" action; requirement changes are additive to the existing splash requirements.

## Impact

- **New code:** `packages/investigation-archive` (schema, `InvestigationArchiveService` facade, writer/reader, ports, tests), desktop `src/services/investigationArchive/` (sql.js engine adapter, Tauri/browser file access adapter, session mapping to `ImageData`), AppHeader save button, SplashScreen open/resume wiring, `src-tauri/capabilities/default.json` (fs permissions).
- **Dependencies:** `drizzle-orm` + `sqlite-proxy` driver, `sql.js` (WASM SQLite; ~1 MB wasm asset bundled), `fflate` (zip). No Rust/Cargo changes.
- **Tests:** package Jest suite (TDD: red→green→refactor) for format round-trip, DB schema, service behaviors; desktop Jest for session mapping; Playwright E2E for save (dialog mocked, bytes unzipped and asserted in the test), open-from-splash, resume-restores-state, recent-list updates. `bootApp` gains canned `plugin:dialog` / `plugin:fs` command mocks.
- **Performance note:** large archives cross the Tauri IPC as base64 — acceptable for v1; noted as known limitation in design.