# Tasks

## 1. Pin and package the single OpenCV.js runtime

- [x] 1.1 Pin `@opencvjs/web@5.0.0-release.2`; validate required operations and process deterministic images in a Chromium worker smoke test with no external requests.
- [x] 1.2 Bundle the baseline WASM runtime with Vite and document PNG/JPEG plus WebView-dependent codecs, Tauri/CSP behavior, commands, bundle size, and startup time in `packages/image-processing-middleware/README.md`; verify the production build and local runtime path.

## 2. Implement the test-driven preprocessing middleware

- [x] 2.1 Test typed packets, byte preservation, EXIF orientation, alpha compositing, scale/resource caps, manifests, and typed failures; implement the middleware and `ocr-default-v1` profile.
- [x] 2.2 Exercise conditional scale/sharpen/denoise/threshold/deskew/margin decisions and inverse coordinate mapping with deterministic browser and unit fixtures.
- [x] 2.3 Compare source and processed CER/WER on six fixtures; document measured error, runtime, resource caps, and limitations. Strong-noise fixtures skip aggressive cleanup and do not regress against unchanged OCR in this baseline.
- [x] 2.4 Document the API, profile, transform manifest, supported formats, and commands; verify package tests, lint, typecheck, and build.

## 3. Run preprocessing at the Image node boundary

- [x] 3.1 Verify the Image handler processes once before branches, shares one packet, reports progress, and blocks downstream nodes on failure; cache packets per selected image for the workflow run.
- [x] 3.2 Verify OCR and Visual Text & Identifiers receive processed bytes, provenance receives source bytes, and OCR/identifier word boxes map back to source coordinates.
- [x] 3.3 Add schema v6 preprocessing-manifest and OCR-word columns; verify append/migration behavior for OCR, provenance, identifier, and failed forensic results while preserving existing history.
- [x] 3.4 Verify the accessible Image-node progress bar/status without introducing a node type or settings; run focused component tests and desktop typecheck.

## 4. Integration verification

- [x] 4.1 Run middleware/store/workflow tests, lint, typecheck, builds, desktop unit tests, desktop lint/typecheck/build, focused Workbench Playwright coverage, and `openspec validate --all`.
- [x] 4.2 Verify PNG/JPEG preprocessing without network access on the current Linux Chromium host, source/processed byte routing, per-run reuse, and history-preserving migration. Generic WebAssembly avoids CPU ABI-specific builds; native WebView checks on macOS/Windows remain part of release validation.

## Workflow follow-up

- Archive the change after implementation, validation, and project review requirements are satisfied.
- Verify the archived specifications reflect the shipped behavior.
