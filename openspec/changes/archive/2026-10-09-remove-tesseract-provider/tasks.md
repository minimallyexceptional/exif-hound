# Tasks

## 1. Middleware and dependencies

- [x] 1.1 Remove Tesseract provider implementation and make PaddleOCR the only default provider; add tests for default Paddle and explicit rejection of Tesseract.
- [x] 1.2 Remove Tesseract dependencies, tests, and public API exports; verify OCR middleware package tests, typecheck, and build.
- [x] 1.3 Retain historical Tesseract result attribution types and add compatibility tests for reading stored rows.

## 2. Workflow and Workbench

- [x] 2.1 Remove the OCR provider selector and provider field from new OCR node defaults.
- [x] 2.2 Normalize legacy `tesseract` and missing workflow provider values to PaddleOCR when loading and save the normalized graph.
- [x] 2.3 Verify OCR and Text & Identifiers nodes call PaddleOCR and preserve result attribution.

## 3. Packaging and validation

- [x] 3.1 Remove Tesseract asset copying and ensure the production app still packages local Paddle models and runtime assets.
- [x] 3.2 Run middleware/workflow/archive tests, desktop lint, typecheck, production build, and Paddle offline browser smoke coverage.
- [x] 3.3 Run `openspec validate --all`, then archive the completed change.
