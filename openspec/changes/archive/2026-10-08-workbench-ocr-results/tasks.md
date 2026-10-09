# Tasks

## 1. Project database persistence

- [x] 1.1 Add schema v3 OCR result table and an idempotent migration; verify v2 migration preserves image rows and current-version creation includes OCR storage.
- [x] 1.2 Update validation/open ordering to accept supported v2 projects and migrate them; verify with ProjectStore migration tests.
- [x] 1.3 Add stable image identity and OCR save/read methods, replacing the image's latest result transactionally; verify round-trip association and replacement with package tests.

## 2. Desktop OCR workflow

- [x] 2.1 Expose stable project image identity and image bytes to Workbench OCR; verify stored result lookup remains tied to the same image after selection changes and project reopen.
- [x] 2.2 Wire the OCR middleware into desktop lifecycle and add per-image progress, retryable failure status, no-text dialog, and results availability; verify with focused component tests.
- [x] 2.3 Add full-screen OCR results view with source image identity, return-to-Workbench selection restoration, and per-entry clipboard feedback; verify navigation and clipboard states with UI tests.

## 3. Integration

- [x] 3.1 Verify the persistence/reopen and UI workflow contracts with focused desktop and package tests (279 tests pass across 46 suites).
- [x] 3.2 Run `openspec validate --all` and resolve any specification or implementation gaps.
