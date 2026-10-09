# Tasks

## 1. Extend OCR with word-level evidence

- [x] 1.1 Add failing OCR middleware and worker-adapter tests for word text, normalized confidence, image-space bounding boxes, empty words, and unchanged text/confidence behavior; implement the additive result contract until the tests pass.
- [x] 1.2 Document word-level result coordinates, offline worker resource configuration, and compatibility in `packages/ocr-middleware/README.md`; verify documented package checks run successfully.

## 2. Build local image-forensics middleware test-first

- [x] 2.1 Create `packages/image-forensics-middleware` workspace metadata and typed public APIs with injected OCR, metadata, and image-structure boundaries; verify it builds without React, Tauri, DOM, workflow, or database imports.
- [x] 2.2 Add failing `ImageProvenanceAnalyzer` tests for editor software indicators, timestamp inconsistencies, JPEG structure facts, missing/unsupported fields, malformed input, and stable result versions; implement the analyzer and local adapters until tests pass.
- [x] 2.3 Add failing `VisualIdentifierDetector` tests for word/bounding-box association, email/URL/phone/coordinate candidates, disabled rules, regional profile-gated plate candidates, empty OCR, and OCR failures; implement deterministic rules until tests pass.
- [x] 2.4 Add lifecycle/progress/error tests and package documentation for local resource configuration, indicator/candidate interpretation, API usage, and test commands; verify package tests, lint, typecheck, and build pass.

## 3. Extend workflow core for forensic nodes

- [x] 3.1 Add failing graph tests for provenance and visual-identifier node types/settings, typed image/evidence connections, Evidence Report outputs, and valid/incomplete forensic paths; implement graph contracts and validation until tests pass.
- [x] 3.2 Add failing package-handler and runner tests for injected forensic services, dependency ordering, progress, result retention, and failure behavior; implement handlers and scheduling until tests pass.
- [x] 3.3 Update workflow package documentation with the new node contracts and verify portable workflow serialization tests/build continue to pass.

## 4. Persist forensic results in project databases

- [x] 4.1 Add failing migration/store tests for separate append-only provenance and identifier result tables, workflow-run/node/image references, empty successful results, failed rows, and existing OCR/history preservation; implement idempotent schema migration and store APIs until tests pass.
- [x] 4.2 Add failing persistence-adapter tests for normalized provenance facts/indicators, OCR word boxes/candidate settings, timestamps, status, and result history; implement adapters until tests pass.
- [x] 4.3 Document the project schema and migration behavior; verify focused investigation-archive tests and typecheck/build pass.

## 5. Integrate Workbench UI and workflow execution

- [x] 5.1 Add reusable presentation-only flow nodes and catalog entries for Image Provenance, Visual Text & Identifiers, and Evidence Report; verify component tests for node rendering, typed connections, and theme tokens pass.
- [x] 5.2 Add inspector controls for OCR languages, candidate families, and optional plate profile, plus saved evidence inspection/copy behavior; verify component tests cover settings, empty results, result details, and copy without triggering execution.
- [x] 5.3 Wire local middleware handlers, per-tool persistence, progress, failures, and run output loading into the Workbench; verify integration tests cover successful and failed paths and retained run history.
- [x] 5.4 Verify both light/dark UI behavior and accessible interactions for new nodes; run focused desktop tests and typecheck.

## 6. Integration verification

- [x] 6.1 Run package tests, lint, typecheck, builds, desktop lint/typecheck/unit tests, and focused Playwright workflow coverage; resolve failures and run `openspec validate --all`.
- [x] 6.2 Verify an existing project database migrates without losing OCR/workflow history and a project can run both transforms, reopen saved evidence, and copy a finding; record the verification outcome in this change.

### Verification outcome

- Four middleware/store/workflow package test suites pass (77 tests total); package lint, typecheck, and builds pass.
- Desktop unit suite passes (250 tests); focused Workbench suite passes (12 tests) including failure persistence and evidence copy; desktop lint and typecheck pass.
- The Workbench saved workflow and drag/connect Playwright tests pass (2 tests).
- Desktop production build succeeds and includes locally generated Tesseract worker, WebAssembly core variants, and English trained data under `dist/ocr/` (47 MB).
- Investigation archive tests cover v4-to-v5 migration while preserving prior OCR/workflow history. Workbench integration tests cover successful persistence for both transforms, failed provenance persistence, saved evidence reopening, and copying a candidate.

## Workflow follow-up

- Archive the change after implementation, validation, and project review requirements are satisfied.
- Verify the archived specifications reflect the shipped behavior.
