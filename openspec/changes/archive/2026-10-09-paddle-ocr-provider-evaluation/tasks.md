# Tasks

## 1. Provider-neutral OCR middleware

- [x] 1.1 Add provider selection, default Tesseract behavior, and provider/version attribution to the OCR contract; add failing tests for omitted, selected, and invalid providers, then verify the middleware suite passes.
- [x] 1.2 Implement PaddleOCR result mapping without fabricated word boxes; add tests for text joining, confidence mapping, no-text results, progress, provider errors, and lifecycle reuse, then verify the OCR middleware suite passes.

## 2. Local PaddleOCR runtime

- [x] 2.1 Pin the official PaddleOCR browser SDK and required ONNX Runtime Web dependency; identify and package only the PP-OCRv6 small English-capable model and WASM assets, verifying the production build emits all assets locally.
- [x] 2.2 Add a worker-backed Paddle adapter configured with explicit local model/WASM paths and baseline WASM execution; verify a browser runtime smoke test completes with network requests disabled.
- [x] 2.3 Update OCR middleware package documentation for provider configuration, Paddle asset licensing/attribution, model/runtime versions, offline behavior, and platform support; verify documented paths and versions match packaged assets.

## 3. Workflow provider selection

- [x] 3.1 Add provider selection to OCR node settings with Tesseract defaults for new and legacy workflows; add handler/serialization tests and verify the workflow package tests pass.
- [x] 3.2 Add the provider selector to the OCR inspector and pass the chosen provider to the middleware; add Workbench tests for changing, saving, restoring, and running each provider.
- [x] 3.3 Display provider and model/engine version in OCR result history; verify both providers can produce separate, attributable entries for the same project image.

## 4. Project result attribution

- [x] 4.1 Add provider and engine/model version columns to OCR results and an idempotent schema migration that marks legacy records as Tesseract; add migration and round-trip tests and verify the archive package suite passes.
- [x] 4.2 Verify existing OCR text, confidence, word boxes, image references, timestamps, and workflow links survive migration from the previous schema.

## 5. Integration verification

- [x] 5.1 Run desktop lint, typecheck, production build, relevant unit tests, and OCR/Workbench Playwright coverage; verify all gates pass.
- [x] 5.2 Run `openspec validate --all` and verify all change artifacts and updated capabilities validate.

## Workflow follow-up

- Archive the change after implementation and validation are complete.
- Run `openspec validate --all` after archiving.
