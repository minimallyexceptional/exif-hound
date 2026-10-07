# Design — investigation-save-resume

## Context

The app is Tauri 2 + React with `dialog`/`fs` plugins registered in Rust but **no fs permissions** in `capabilities/default.json` (must be added). File saving today (exports) uses the browser FS Access API with a download fallback. Packages are consumed via a Vite alias to `dist` (`exif-middleware` pattern) and built with tsup. Images live in memory only; `ImageData` = `{ id, file, url, exif, isProcessing }` with `exif` a serializable-ish object. The splash screen's recent list is an empty-state placeholder awaiting this change.

## Goals / Non-Goals

**Goals**
- Durable, testable archive domain logic in `packages/investigation-archive` (OOP, ports, TDD red→green→refactor).
- Round-trip fidelity: bit-identical images, metadata restored without re-extraction.
- Resume from splash (recent entries + Open button) recreating the session.

**Non-Goals**
- Autosave, file watching, or multiple-open investigations.
- Persisting global preferences (map style/theme — already in SettingsContext) or transient map-local UI toggles (heatmap/clusters/reticle). KML/CSV imports, route toggle, view mode, and investigation tool ARE persisted (see D4).
- Rust-side archive code; incremental/partial writes.

## Decisions

### D1 — Package: `packages/investigation-archive`
Structured like `exif-middleware` (tsup esm+cjs, Vite alias to `dist`, own Jest suite). Inside:

```
src/
  index.ts                 # public API
  format.ts                # FORMAT_VERSION, entry names, manifest type + validation
  schema.ts                # drizzle sqlite schema (investigation_meta, images)
  migrations.ts            # idempotent DDL applied on open/create
  ports.ts                 # DatabaseEngine + Zipper interfaces
  fflateZipper.ts          # Zipper backed by fflate (zipSync in Node/tests)
  ArchiveWriter.ts         # session records → archive bytes
  ArchiveReader.ts         # archive bytes → investigation record + images
  InvestigationArchiveService.ts  # OOP facade (create/save/open/listImages)
```

OOP style: stateless-ish service class composed with injected ports; writer/reader as classes over the ports. Dependency inversion: the package defines `DatabaseEngine { exec(sql, params): Promise<QueryResult> }` and `Zipper { zip(entries): Promise<Uint8Array>; unzip(bytes): Promise<Map<string, Uint8Array>> }`; the desktop app binds real runtimes. Rationale: full format logic testable in Node without Tauri or wasm-locating quirks in the browser; mirrors the user's "make a new OOP service in /packages" requirement.

### D2 — SQLite via sql.js WASM + drizzle `sqlite-proxy`
`drizzle-orm` + `drizzle-orm/sqlite-proxy` over a `sql.js` WASM database. The desktop app owns the sql.js bootstrap (wasm asset via Vite `?url` import) and adapts it to `DatabaseEngine`; tests in the package use sql.js directly in Node (works out of the box). DB bytes (`db.export()`) are embedded in the archive; opening inits sql.js from those bytes. Drizzle gives typed schema + queries in both environments through one driver.

- *Alternative: `tauri-plugin-sql`* — rejected: Rust plugin registration, divergent prod/test runtimes, worse package testability.
- *Alternative: raw SQL strings* — rejected: drizzle keeps schema typed and migration-safe; user named drizzle.
- Known cost: ~1 MB wasm in the bundle; acceptable for a desktop app.

### D3 — Zip via `fflate`
`zipSync`/`unzipSync` through the injected `Zipper` (prod + tests same impl; sync is fine — archives are local and images are already in memory). No worker plumbing for v1. fflate is dependency-free and tiny.

### D4 — Database schema (drizzle)
```ts
investigationMeta: id (int pk, always 1), name, createdAt, savedAt, appVersion, formatVersion,
                   viewMode, showRoute (int bool), investigationTool (nullable),
                   importType (nullable 'kml'|'csv'), importData (nullable raw text)
images: id (int pk autoincrement), fileName, archivePath (unique), exifJson (text),
        hasImage (int bool — 1 only when bytes live in images/), sourceUrl (nullable —
        external image URL for imported point entries), addedAt
```
Session state (view mode, route toggle, investigation tool, raw import text) rides in `investigation_meta`: on resume the app re-parses stored KML/CSV via the existing `parseImportData` and re-applies `viewMode`/`showRoute`/tool. CSV points persist as `images` rows with `hasImage = 0` and no bytes in `images/`; the map's existing `hasImage` detection works unchanged.
`exifJson` stores the serialized extracted metadata (`exif` object without runtime-only fields). Manifest (`investigation.json`) carries `formatVersion`, `name`, `createdAt`, `savedAt`, `imageCount`, `appVersion` for cheap pre-DB validation and future tooling; the DB is the source of truth.

### D5 — File I/O: Tauri dialog + fs plugins, browser fallback
Desktop `src/services/investigationArchive/fileAccess.ts`:
- Save: `save()` (plugin-dialog) → path → `writeFile(path, bytes)` (plugin-fs). Filter `[{ name: 'Investigation', extensions: ['investigation'] }]`, default path last-used-or-timestamped.
- Open: `open()` (plugin-dialog, same filter) → `readFile(path)` (plugin-fs).
- Browser/dev fallback: FS Access API (`showSaveFilePicker`/`showOpenFilePicker`), matching the existing export util's dual-path pattern.
Capabilities gain `fs:allow-read-file` and `fs:allow-write-file` with a `**` path scope (dialog-chosen paths must be writable; local-first desktop app). E2E mocks `plugin:dialog|save/open` and `plugin:fs|write_file/read_file` as canned commands in `bootApp`.
- Known limitation: bytes cross Tauri IPC as JSON arrays/base64 — slow for very large archives; acceptable v1, revisit with a Rust write command later.

### D6 — Desktop session mapping (`ArchiveSessionService`)
`src/services/investigationArchive/` maps package records ↔ app model:
- **Save:** `ImageData[]` → `{ fileName, bytes: file → Uint8Array, exifJson }` records (skip `isProcessing` placeholders, skip `error` images? no — save everything resumable; error images re-save with error state dropped), name from session.
- **Open:** records → `ImageData`/`ImportedPoint` with `id` regenerated; images get `url = URL.createObjectURL(new File([bytes], fileName))`, `exif = JSON.parse(exifJson)`, `isProcessing: false`; CSV points (`hasImage = 0`) restore as point entries with no bytes. No `processExifData` call — restored entries bypass the worker entirely.
- App state on open: `images` replaced wholesale (per spec: current session left intact on failure — so build the full list first, then commit), `viewMode` reset to `'map'`, `selectedImageId` null.

### D7 — Recent investigations history
localStorage key `exifhound.recentInvestigations`: `[{ path, name, lastOpenedAt }]`, capped 10, sorted by `lastOpenedAt`. Written on save and on open (dialog or resume). Splash renders entries as buttons (they're resumable now — this is the durable change the placeholder design anticipated); missing-file failures surface the open error and keep the entry (no silent pruning).

### D8 — Save button placement
AppHeader, next to Export: `Save` lucide icon + label, `Button` secondary, disabled (`opacity-50`) when `images.length === 0`. On success/failure reuse the app's alert/toast register (inline status like `importError`).

### D9 — TDD discipline
Package work proceeds strictly red→green→refactor per behavior: format constants/manifest validation → migrations + schema → writer (manifest, db, images entries) → reader (validation, unsupported version, round-trip) → service facade. Each task below lists its failing-test-first step; tests run before implementation exists (red), then implementation makes them pass (green), then refactor with tests green. Desktop integration (wiring, E2E) follows the package being green.

## Risks / Trade-offs

- [Tauri IPC serialization of large archives] → v1 accepted; a Rust save command is the escape hatch if users hit multi-100MB archives.
- [sql.js wasm asset in Vite/tauri bundling] → verified in implementation with a dev-mode smoke test; `?url` import keeps it an asset.
- [drizzle ESM/Jest friction] → package uses its own jest config (ts-jest cjs like desktop); if drizzle's ESM entry resists, pin to its cjs export — contained inside the package.
- [Archive with zero images] → save requires ≥1 image (button disabled), but reader must still tolerate an empty images set (defensive round-trip test).
- [Duplicate original filenames] → writer dedupes `images/` paths (`name-1.jpg`), reader maps via db rows, never by name.
- [localStorage history references moved/deleted files] → resume failure surfaces the error; entry retained (spec), pruning deferred.

## Migration Plan

Self-contained additive change. New localStorage key; no existing data migrations. Rollback = revert. `.investigation` files written by v1 are forward-documented via `formatVersion`.

## Open Questions

None requiring user input before implementation — the two genuinely open choices (SQLite runtime, resumable recent list) are resolved as D2 and D7 and flagged in the proposal for approval.