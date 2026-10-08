# Design — project-folders

## Context

Baseline: RC with `feature/investigations` merged (exif-insights engine + dashboard are in). The `investigation-archive` package (drizzle sqlite-proxy schema + sql.js provider + ports + zip writer/reader) and its desktop wiring exist. The user's direction: replace the zip save/open model with live project folders.

## Goals / Non-Goals

**Goals**
- Project = named folder in a parent the user picks; `data.db` created first; everything writes through live.
- Images, EXIF results, imports (KML/CSV), and session/investigation state are durable in the project folder.
- Open-existing-project with validation; views repopulate from the db with no re-extraction.

**Non-Goals**
- Multiple simultaneous projects; project templates; syncing between machines.
- Migrating previously exported `.investigation` zip files into projects (superseded; user accepted).
- Storing derived insight *outputs* in the db (insights recompute from persisted metadata — cheap and stateless; only the tool selection persists).

## Decisions

### D1 — Evolve `packages/investigation-archive` in place → project store
Keep: `ports.ts` (DatabaseEngine), `sqlJsProvider.ts`, `schema.ts`, `migrations.ts`, `db.ts`, drizzle. Remove: `ArchiveWriter.ts`, `ArchiveReader.ts`, zip manifest code, `fflate` dependency, zip-related tests. Add: project folder operations (create/validate, image file writing with dedupe, import file registry, state write-through). The package keeps its OOP facade class (`InvestigationProjectStore`). Rationale: the db layer is exactly what the new model needs; zip code is now dead weight. New name stays `investigation-archive` in package.json to avoid workspace churn? No — renaming to match reality is cheap (package.json name change + alias). Decision: **rename to `investigation-project`**... actually renaming touches imports in ~6 files plus tsup/alias — modest, and the misleading name ("archive" = zip) is exactly the confusion to avoid. Keep it simple: keep the package name `investigation-archive` (git history, less churn), but its docs/comments describe the project-store role. Flagged for the user to veto.

### D2 — data.db schema v2 (superset migration)
Extend the existing schema with idempotent migrations (run on open/create):
```ts
investigation_meta: id, name, created_at, saved_at, app_version, format_version,
                    view_mode, show_route, investigation_tool          (existing cols)
project_imports:    id (pk), type ('kml'|'csv'), file_name, added_at  (NEW — registry; raw file lives beside db in data/)
images:             id, file_name, disk_path, exif_json, has_image, source_url, added_at
```
Changes from v1: `disk_path` replaces `archive_path` (relative path inside `images/`, e.g. `beach-1.jpg`); `project_imports` table added. `saved_at` becomes a "last activity" timestamp updated on writes. Meta row id stays 1.

### D3 — Write-through wiring (desktop)
`ProjectSessionService` (desktop, maps package ↔ app model, successor of ArchiveSessionService):
- **Project open/create** returns `{ rootPath, dbProvider }`; a singleton store instance binds one engine to the project's `data.db` via the Tauri fs adapter.
- **Engine port on disk**: new `TauriFileDatabase` — sql.js engine loads bytes from `data/data.db` at open; **every mutating operation calls a flush hook** that serializes and writes `data.db` back to disk (write-through at operation granularity, debounced 500ms; app-close flush on Tauri exit hook). Rationale: simple, atomic single-file durability; no per-statement fs churn.
- **Uploads**: `ImageData` bytes are written to `images/<deduped-name>` via plugin-fs `writeFile`; the db row is inserted after the file write succeeds; the app state update happens only after both.
- **Imports**: raw KML/CSV text written to `data/<name>.kml|.csv`; `project_imports` row upserted; previous file replaced (delete old path if name differs).
- **State**: view mode/showRoute/tool changes debounced write to `investigation_meta`.

### D4 — Project creation UX
Modal dialog on the splash ("Start new investigation"): parent folder picker (tauri dialog `directory: true`) + name text input. Creates folder tree + db, then enters the app in the empty-upload state (same as today's entrypoint). In-browser dev (no Tauri): feature disabled with an explanatory message (existing FS Access fallback doesn't support directory creation; acceptable — this is a Tauri-only feature).

### D5 — Open validation
"Open existing project" folder picker (`directory: true`): check `<sel>/data/data.db` exists and `images/` exists (plugin-fs `exists`), then open the db (sql.js from bytes) and assert expected tables exist (migration probe). Failure → typed error surfaced on splash; nothing loads.

### D6 — No-project mode
The app can still run without a project (splash "Start new investigation" now *requires* creation; the old direct-entry is gone). Users without a project see the splash only. `App.tsx` `sessionState` becomes `'splash' | 'active'` where active always has a project bound. Recent history = project folders.

### D7 — Tauri permissions
Add `fs:allow-mkdir` (for images/ + data/ creation), keep existing read/write. Dialog already has `dialog:default`.

### D8 — TDD
Package work strictly red→green→refactor per task (project create/validate, image write + dedupe, import registry, state write-through, disk-engine flush). Desktop mapper tests follow. E2E covers create→upload→reopen, validation failures, import replacement.

## Risks / Trade-offs

- [Debounced flush can lose the last ~500ms on a hard kill] → acceptable; flush also runs on every project close and app exit hook.
- [Large image files cross IPC as arrays on write] → same known limitation as before; Rust-side write is the escape hatch.
- [Browser dev mode loses project features] → Tauri-only feature; dev/test uses Tauri mocks (E2E already mocks plugin commands).
- [Old `.investigation` files unreadable] → accepted by user (zip flow retired).

## Migration Plan

New `data.db` schema extends the prior one via idempotent migrations; projects created fresh. The zip flow's UI/services are removed. Rollback = revert commit.

## Open Questions

None blocking — package naming (keep `investigation-archive` name, project-store role) is flagged in D1 for the user to veto.