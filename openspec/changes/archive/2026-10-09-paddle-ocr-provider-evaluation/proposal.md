# Proposal

## Why

Tesseract is producing useful results mainly on clean, high-contrast documents, while Workbench images may contain text in varied scenes. Users need a direct way to compare a stronger local OCR candidate against Tesseract on the same images before choosing a long-term default.

## What Changes

- Add PaddleOCR as a second local OCR provider in the UI-independent OCR middleware.
- Add an OCR provider selector to OCR node settings, with Tesseract remaining the default for existing and new workflows.
- Persist the selected provider with the OCR result so output history remains attributable and comparable after reopening a project.
- Keep both providers offline-capable, worker-backed, and compatible with supported desktop platforms and architectures by bundling model/runtime assets rather than fetching them at recognition time.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ocr-middleware`: support selecting and using either local OCR provider through the framework-independent middleware contract.
- `workbench-ocr`: expose provider selection on OCR nodes and attribute persisted output history to the provider used.

## Impact

- `packages/ocr-middleware`: provider-neutral API, worker adapters, lifecycle and result mapping.
- `apps/exif-hound-desktop`: OCR worker/runtime assets, node settings selector, provider-aware recognition call and output history display.
- `packages/investigation-archive`: OCR result schema migration and provider attribution.
- `packages/workbench-workflow`: OCR node setting validation/defaults and handler contract, if required by the existing typed settings model.
- Build/package assets: pinned PaddleOCR browser SDK, ONNX Runtime Web/WASM and local model files; final bundle size and offline loading need validation.

