# Proposal

## Why

The current save model (manual `.investigation` zip export) loses work between saves and doesn't match how investigators work: a project is a folder on disk. Moving to a project-folder model — named folder in a user-chosen parent, with `images/` and `data/data.db` — makes every action durable immediately (upload, EXIF result, import, view state) with no save step, and makes projects portable across machines.

## What Changes

- **Project folder model** (replaces `.investigation` zip archive):
  - New project: user picks a parent folder + names the project → the app creates `<parent>/<name>/` containing `images/` and `data/data.db` (created **first**, before anything else).
  - Uploaded images are written **directly to `<project>/images/`** on disk (original bytes preserved; filename collisions deduped).
  - EXIF middleware results for every image are written to `data/data.db`.
  - Imported KML/CSV files are written to `<project>/data/` (a second import **replaces** the first, per current scope).
  - Investigation/session state (view mode, route toggle, investigation tool, import registry) is written to the db.
- **No save button.** All writes are live write-through. The zip save/open flow and its `investigation-archive` package role are retired.
- **Splash screen**: "Open investigation…" becomes **"Open existing project"** — folder picker; the app verifies the selected folder has `data/data.db` + `images/` (validating the db opens and the schema matches) before loading, with a clear error when it doesn't. Recent projects list points at project folders.
- **List view / all views repopulated from the database** when a project is opened (no EXIF re-extraction).
- Requires merging `feature/investigations` first (done in this change's baseline) so insight tooling state is covered by the same persistence.

## Capabilities

### New Capabilities
- `project-store`: The on-disk project folder format, `data.db` write-through persistence, project creation/open/validation, and the OOP package that owns it.

### Modified Capabilities
- `investigation-persistence`: **REMOVED** — the zip archive save/open flow is replaced by project folders. (Delta marks requirements removed with reason + migration.)
- `splash-entrypoint`: Open action becomes "Open existing project" (folder picker + validation); recent list becomes recent project folders.

## Impact

- **New/changed package:** evolve `packages/investigation-archive` → project store (drizzle schema + sql.js provider + ports retained; zip writer/reader retired) — or a new package; decided in design.
- **Desktop:** project creation modal (parent folder + name), write-through service wiring in App.tsx, upload/import hooks write to disk, save button + save-status UI removed, splash open button becomes folder-based with validation.
- **Tauri:** already have `dialog`, `fs` (read/write), `mkdir`, `exists` via plugin-fs; may need `fs:allow-mkdir`.
- **Tests:** package TDD suite (schema, CRUD, project validation, collision handling); desktop mapping tests; E2E for create-project, upload-to-disk, open-existing-project validation, KML/CSV replacement, list repopulation.