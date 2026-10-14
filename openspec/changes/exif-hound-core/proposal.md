# Proposal: EXIF Hound Core

## Why
The desktop app imports six domain packages and hosts business logic in `src/services` and `src/utils`, coupling UI to middleware and archive internals. We need one stable application API, testable domain layer, and presentational UI.

## What Changes
- New workspace package `exif-hound-core` exposing `ExifHoundCore` with OOP facade namespaces (middleware, archive, project, workbench, evidence, import/export, updater, geocoding).
- Tauri/desktop adapters live inside core; `createDesktopCore()` wires default ports.
- Move desktop business logic from `services/**` and domain utils into core; add desktop **controllers** that call core only.
- ESLint + `scan:domain-imports` forbid direct imports of underlying packages and `exifreader` from the desktop app.

## Impact
- `packages/exif-hound-core` (new).
- `apps/exif-hound-desktop`: dependency shrink to `exif-hound-core` for domain; new `controllers/`; workers import core worker subpaths.
- Underlying packages unchanged as engines; no website changes.

## Out of Scope
- Renaming `investigation-archive` or other engine packages.
- New product features beyond refactor parity.
