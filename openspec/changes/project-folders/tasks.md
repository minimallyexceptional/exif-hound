# Tasks — project-folders

## 1. Package: project store (TDD red→green→refactor)

- [x] 1.1 RED: strip zip writer/reader — delete `ArchiveWriter.ts`, `ArchiveReader.ts`, zip tests, `fflate` dep; GREEN: suite (schema/db/provider tests) stays green; REFACTOR exports. Verify: `npm test --workspace=investigation-archive`.
- [x] 1.2 RED: `ProjectStore.test.ts` — `createProject(parent, name)` creates `data/data.db` (migrated schema) + `images/`; name collision fails without creating anything; `validateProjectFolder(path)` accepts a valid folder and rejects missing `data/data.db`, missing `images/`, and foreign/corrupt db with typed errors. GREEN: implement with fs port (`FsPort`: exists, mkdir, writeFile, readFile, listDir). REFACTOR. Verify: green.
- [x] 1.3 RED: image records — `addImage(fileName, bytes, exif)` writes `images/<deduped>` via FsPort, inserts row (disk_path, exif_json); listing returns records; duplicate names dedupe; point entries (no bytes, sourceUrl) supported. GREEN + REFACTOR. Verify: green.
- [x] 1.4 RED: imports — `addImport(type, fileName, text)` writes raw file to `data/` + registry row; second import of same type replaces (old file removed when name differs). GREEN + REFACTOR. Verify: green.
- [x] 1.5 RED: state + persistence — `getState()`/`setState({viewMode, showRoute, tool})` persists to meta; `flush()` serializes db bytes; engine re-open from those bytes round-trips everything. GREEN + REFACTOR. Verify: green; build passes.

## 2. Desktop binding

- [x] 2.1 Jest-first: `TauriFsPort` + `TauriFileDatabase` — open project db bytes from disk, debounced flush hook writes back via plugin-fs; mapper updates in `ProjectSessionService` (rename of ArchiveSessionService: open/create flows, records↔ImageData with disk paths). Verify: desktop Jest green.
- [x] 2.2 Remove zip save/open wiring: delete fileAccess zip paths, save-status UI, `saveInvestigation`; recent list becomes project folders (`recentProjects.ts`). Verify: typecheck + lint.

## 3. UI wiring

- [x] 3.1 Project creation modal on splash (parent folder picker + name input) → creates project → enters app empty-upload state. Verify: desktop Jest.
- [x] 3.2 Splash "Open existing project" folder picker + validation errors; recent projects resume. Verify: desktop Jest.
- [x] 3.3 App.tsx: bind project store on active; upload hook writes images to disk + db; import hook writes KML/CSV files; state changes write through; list view reads from db records. Verify: typecheck + Jest.
- [x] 3.4 Add `fs:allow-mkdir` capability. Verify: tauri build dry-run/typecheck.

## 4. E2E

- [x] 4.1 bootApp mocks: `plugin:dialog` (folder pickers), `plugin:fs` (mkdir/exists/write/read with in-memory fs state). Verify: existing suite green.
- [x] 4.2 `project.spec.ts`: create project (mock parent + name) → upload fixture → assert mkdir/write order, db row contents via package open; reopen → list view repopulated, no re-extraction; import KML twice → replacement; invalid folder open → error, splash intact. Verify: npx playwright test project.

## 5. Gates

- [x] 5.1 lint/typecheck/unit(all workspaces)/E2E/build all green.
- [x] 5.2 `openspec validate --all` passes; impeccable detect on changed UI.
