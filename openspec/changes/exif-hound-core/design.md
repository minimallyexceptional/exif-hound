# Design — exif-hound-core

## Context
Desktop currently aliases six packages in Vite and implements evidence, workbench, project session, and updater in `apps/exif-hound-desktop/src/services`.

## Goals
- Single import surface: `exif-hound-core` (+ `./desktop`, `./workers/*`).
- 100% business logic in packages, orchestrated by core facades.
- Dumb React components; optional controller classes per major view.

## Non-Goals
- Website app consumption of core.
- Breaking changes to engine package public APIs.

## Decisions

### D1 — Root type `ExifHoundCore`
Composition root with readonly namespace objects. Facades delegate to engine packages; no duplicate business rules.

### D2 — `createDesktopCore`
Factory in `exif-hound-core/desktop` registers Tauri `FsPort`, sql.js provider, dialog helpers, OCR asset resolution, updater backend. Unit tests inject in-memory ports.

### D3 — Worker subpaths
Thin worker files in app import `exif-hound-core/workers/exif` and `.../image-processing` to keep Vite worker URLs stable.

### D4 — Controllers (desktop)
`AppSessionController`, `WorkbenchController`, `EvidenceController`, `ExifViewController`, `UpdaterController` hold orchestration; exposed via hooks/context. Components do not import domain types from engines—only from core re-exports if needed for props.

### D5 — Enforcement
`no-restricted-imports` in desktop ESLint; root script `scan:domain-imports` fails CI on forbidden strings.

### D6 — TDD
Each facade: failing test → delegate implementation → desktop import swap → refactor.

## Risks
- Large diff → slice by namespace with tests after each slice.
- Tauri in core → ports + fakes for Jest.
