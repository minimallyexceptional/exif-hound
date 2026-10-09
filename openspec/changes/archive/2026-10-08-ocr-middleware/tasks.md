# Tasks

## 1. Package setup

- [x] 1.1 Scaffold the `ocr-middleware` npm workspace with TypeScript build/typecheck/lint/test scripts and Jest configuration; verify npm recognizes the workspace and the empty package typechecks.
- [x] 1.2 Add Tesseract.js and package test dependencies; verify installation completes and the resolved Tesseract.js version is recorded in the lockfile.

## 2. OCR service contract (red-green-refactor)

- [x] 2.1 Write failing service tests for local byte/Blob input, text/confidence mapping, empty text, English default, configured languages, and recognition failures; verify these tests fail because the API is not implemented.
- [x] 2.2 Implement the minimal injectable worker boundary and `OcrMiddleware` facade; verify all recognition contract tests pass using only a fake worker.
- [x] 2.3 Add failing tests for progress normalization/routing, concurrent request ordering, worker reuse, language reinitialization, and dispose behavior; verify each fails before its implementation.
- [x] 2.4 Implement progress routing, serialized recognition, reusable worker lifecycle, and disposal; verify the full service suite passes, then refactor while keeping it green.

## 3. Tesseract.js adapter (red-green-refactor)

- [x] 3.1 Write failing adapter contract tests for configured resource paths, worker creation, language reinitialization, text/confidence extraction, progress events, and worker termination; verify they fail before the adapter exists.
- [x] 3.2 Implement the Tesseract.js worker factory/adapter and public exports; verify adapter tests pass with a mocked Tesseract.js factory without loading WASM or language files.

## 4. Package handoff and integration

- [x] 4.1 Document construction, recognition inputs/options, progress, error behavior, resource configuration, and disposal in the package README; verify examples match exported TypeScript types.
- [x] 4.2 Build the package and run its typecheck, lint, and Jest suite; verify `npm run build --workspace=ocr-middleware`, `npm run typecheck --workspace=ocr-middleware`, `npm run lint --workspace=ocr-middleware`, and `npm test --workspace=ocr-middleware` all pass.
- [x] 4.3 Update the OpenSpec artifacts with implementation results and run `openspec validate --all`; verify the new capability passes validation.

## Workflow follow-up

- Archive the completed change after implementation and validation.
- Verify the archived capability spec and final workspace status.
