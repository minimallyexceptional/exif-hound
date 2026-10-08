# Tasks — investigation-save-resume

## 1. Package scaffold (red first)

- [x] 1.1 RED: Scaffold `packages/investigation-archive` (tsup build, jest config, eslint, typecheck mirroring `exif-middleware`) with a failing placeholder test (`describe('InvestigationArchiveService')`) asserting the public API surface from `design.md` D1. GREEN: export empty stubs so the suite compiles; keep the API test red until 1.4. Verify: `npm test --workspace=investigation-archive` runs and the API test fails for the right reason.
- [x] 1.2 RED: `format.test.ts` — constants (`FORMAT_VERSION = 1`, entry names `investigation.json` / `investigation.db` / `images/`) and manifest validation (valid manifest passes; missing/mismatched `formatVersion`, non-object, missing `imageCount` rejected with typed errors). GREEN: implement `format.ts`. REFACTOR. Verify: suite green.

## 2. Database layer (red→green per behavior)

- [x] 2.1 RED: `schema.test.ts` with an in-memory sql.js `DatabaseEngine` test double — migrations create `investigation_meta` and `images` idempotently (run twice is safe); meta carries session fields (`viewMode`, `showRoute`, `investigationTool`, `importType`, `importData`). GREEN: implement `schema.ts` + `migrations.ts` (drizzle `sqlite-proxy` over the port). Verify: green.
- [x] 2.2 RED: image row round-trip — insert `{fileName, archivePath, exifJson, hasImage, addedAt}`, list back equal; duplicate `archivePath` rejected; empty `images` set tolerated. GREEN: drizzle queries in service internals. REFACTOR. Verify: green.

## 3. Writer + reader (red→green per behavior)

- [x] 3.1 RED: `ArchiveWriter.test.ts` — building an archive from `{name, createdAt, savedAt, appVersion, session: {viewMode, showRoute, investigationTool?, importType?, importData?}, images: [{fileName, bytes, exif, hasImage}]}` yields bytes whose zip contains `investigation.json` (manifest fields correct), a `investigation.db` that opens as SQLite with the right rows, and `images/<path>` byte-identical to the original; duplicate input filenames deduped (`name-1.ext`). GREEN: implement `ArchiveWriter.ts`. REFACTOR. Verify: green.
- [x] 3.2 RED: `ArchiveReader.test.ts` — opening writer output returns the investigation record and per-image entries `{fileName, bytes, exif}` byte-identical with metadata equal; a zip with missing entries, a corrupt manifest, a foreign zip (no manifest), and an unsupported `formatVersion` each fail with distinct typed errors. GREEN: implement `ArchiveReader.ts`. REFACTOR. Verify: green.
- [x] 3.3 RED: `InvestigationArchiveService.test.ts` — facade `save()` → bytes → `open()` → record (incl. session fields) + images equals input (the full round-trip through real sql.js + fflateZipper, no stubs). GREEN: implement the facade. Verify: `npm test --workspace=investigation-archive` fully green; `npm run build:packages` produces `dist`.

## 4. Desktop adapters (wiring the ports)

- [x] 4.1 Jest-first: `src/services/investigationArchive/sqlJsEngine.test.ts` — engine adapts sql.js wasm (Node init) to `DatabaseEngine` and round-trips a package archive through it. Verify: green in desktop Jest.
- [x] 4.2 Jest-first: `ArchiveSessionService` mapping — records→`ImageData` (object URL from bytes, exif from JSON, `isProcessing: false`) and `ImageData[]`→save records (bytes from `File`, exif serialized without runtime fields). Verify: desktop Jest green.
- [x] 4.3 `fileAccess.ts` — Tauri dialog+fs path with FS Access API fallback; save/open filters `.investigation`; cancelled dialog returns null. Verify: typecheck + lint.

## 5. App wiring

- [x] 5.1 AppHeader save button (secondary, `Save` icon, disabled at 0 images) → save flow → success/error status surfaced inline; recent-history write on save. Verify: typecheck + desktop Jest.
- [x] 5.2 Splash: "Open investigation…" button beside "Start new investigation"; recent entries become resumable buttons (name + relative time); history rendering from `exifhound.recentInvestigations`; empty state preserved when none. Verify: typecheck + desktop Jest.
- [x] 5.3 App-level open/resume: `sessionState` gains the restore path — open builds the full image list first, then commits (failure leaves prior state untouched). View mode resets to map. Verify: desktop Jest.

## 6. E2E + capabilities

- [x] 6.1 Add `fs:allow-read-file` / `fs:allow-write-file` (scope `**`) to `src-tauri/capabilities/default.json`. Verify: `cargo check`-free — build via `npm run tauri:build` dry path or docs-level review; typecheck unaffected.
- [x] 6.2 `bootApp` canned commands: `plugin:dialog|save`, `plugin:dialog|open`, `plugin:fs|write_file`, `plugin:fs|read_file` (+ capture of written bytes). Verify: existing E2E suite still green.
- [x] 6.3 `save.spec.ts`: upload fixtures → Save → dialog mock path → assert captured bytes unzip (via package in the test) to manifest + db + bit-identical images; recent entry appears after reload→splash. Verify: `npx playwright test save`.
- [x] 6.4 `resume.spec.ts`: pre-built archive bytes fed via `plugin:fs|read_file` mock → splash recent entry click → gallery shows restored images with metadata, no re-extraction (`data-processing` false immediately); map state (route toggle + KML overlay) and investigation tool restored; Open button flow with dialog mock; foreign file rejection surfaces error and keeps splash. Verify: `npx playwright test resume`.

## 7. Quality gates

- [x] 7.1 Full gates: `npm run lint`, `npm run typecheck`, desktop + package Jest, `npm run test:e2e`, `npm run build:apps`. Verify: all pass.
- [x] 7.2 `openspec validate --all` passes; mark tasks complete. Verify: validator shows change ✓.
- [x] 7.3 Run the Impeccable detector on changed UI files; address findings. Verify: `impeccable detect --json` over SplashScreen/AppHeader changes returns clean.

## Workflow follow-up

- Archive the change with `openspec archive investigation-save-resume` after user acceptance.
- Performance follow-up (post-v1, not this change): Rust-side save command if large-archive IPC becomes a bottleneck.