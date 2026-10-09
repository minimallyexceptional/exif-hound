# Tasks

## 1. Workflow core package

- [x] 1.1 Create `packages/workbench-workflow` with TypeScript package metadata and public entry points; verify it resolves through npm workspaces and builds without importing React, Tauri, DOM, or desktop modules.
- [x] 1.2 Write failing tests for portable graph/node/edge contracts, serialization, schema-version validation, and graph connection validation; implement the model and serializer until those package tests pass.
- [x] 1.3 Write failing runner tests for dependency ordering, multiple paths, node progress events, duplicate-run rejection, and failure retention; implement the injected-handler workflow runner until tests pass.
- [x] 1.4 Document package contracts and how to add/test a node handler; verify the documented package test and build commands run successfully.

## 2. Project persistence and migration

- [x] 2.1 Write failing store/migration tests for named workflows, workflow runs, append-only OCR results, and v2/v3 upgrades; implement idempotent schema v4 migration and store APIs until tests pass while preserving legacy OCR rows.
- [x] 2.2 Add failing persistence-adapter tests for run state/timing and per-step result writes, including empty OCR results and failed steps; implement adapters until tests pass using database fakes or in-memory fixtures.
- [x] 2.3 Document schema v4 tables, legacy-row migration, and rollback limitations; verify OpenSpec requirements and migration documentation agree.

## 3. Machine-wide workflow library

- [x] 3.1 Add failing tests for cross-platform workflow names, Unicode, reserved names, case-insensitive collisions, malformed JSON, and version handling; implement the portable workflow-file format and validation until tests pass.
- [x] 3.2 Add a desktop filesystem adapter using Tauri home-directory resolution and native path APIs; write failing adapter tests for create/list/save/open/error behavior, then implement atomic writes and duplicate-name handling until tests pass.
- [ ] 3.3 Verify Linux x86_64/ARM64, macOS Apple Silicon, and Windows x86_64 target compilation and workflow-library path behavior where runners are available; document any unavailable local targets and the CI verification.

## 4. Workbench node editor UI

- [x] 4.1 Add `@xyflow/react` and theme-token stylesheet integration; verify desktop lint and typecheck pass with the dependency and stylesheet ordering.
- [x] 4.2 Build reusable presentation-only node components, the categorized catalog, canvas, typed ports, and right inspector; add desktop component tests for add/select/connect/keyboard/theme behavior and verify they pass.
- [x] 4.3 Add project workflow selection/creation, debounced persistence, and restore; add UI integration tests for create/switch/reopen and verify graph positions/settings/connections restore.
- [x] 4.4 Add the machine-wide Workflows tab, save-name prompt, list, and double-click import; test import resets image selections and invalid/missing files preserve the active graph.
- [x] 4.5 Restore the shared `ImageGallery` to vertical-only behavior and add/update Map View gallery tests; verify no Workbench horizontal gallery remains.

## 5. Pipeline execution and OCR outputs

- [x] 5.1 Write failing handler tests for Image input resolution, OCR middleware adaptation, Text output lookup, and empty/error results; implement package-level handlers without moving or changing the OCR middleware API.
- [x] 5.2 Wire Run Workflow, validation errors, overall progress, active-node highlighting, and non-overlapping execution to the runner; add UI tests for running, completion, and failure states.
- [x] 5.3 Persist each OCR step result before advancing, including no-text results, and expose run history/results in the Text inspector with copy actions; add store/UI tests for metadata, append-only history, and copy behavior.
- [x] 5.4 Remove the superseded Workbench single-image tool row and full-screen OCR results route; verify navigation and existing OCR middleware consumers still work.

## 6. Integration verification

- [x] 6.1 Run focused package and desktop tests, lint, typecheck, and production build; resolve failures and verify OpenSpec change validation passes.
- [x] 6.2 Exercise new-project, migrated-project, workflow save/open across projects, OCR run/history, and output copy flows in the desktop E2E suite; verify all scenarios pass on supported desktop targets where available.
- [ ] 6.3 Verify release builds for the supported matrix (Linux x86_64/ARM64, macOS Apple Silicon, Windows x86_64) and confirm one saved JSON fixture opens across architecture variants.

## Workflow follow-up

- Archive the change after implementation, validation, and project review requirements are satisfied.
- Verify the archived specs reflect the shipped workflow behavior.

## Verification notes

- The current workspace has only `x86_64-unknown-linux-gnu` installed. Rust workflow-library tests passed on that target. Cross-target builds and native path behavior still need CI runner coverage for Linux ARM64, macOS Apple Silicon, and Windows x86_64; the existing release matrix defines those targets in `.github/workflows/release.yml`.
