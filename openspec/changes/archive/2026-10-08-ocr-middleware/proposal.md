# Proposal

## Why

The Workbench needs OCR as an image-analysis capability, but recognition and worker lifecycle must stay out of the UI. A dedicated package gives future tools a small reusable API and lets OCR behavior be developed test-first independently of the desktop screen.

## What Changes

- Add an `ocr-middleware` workspace package under `packages/` backed by Tesseract.js.
- Expose an object-oriented OCR service that accepts local image data, recognizes text, reports progress, and can be disposed cleanly.
- Keep Tesseract worker creation behind an injectable boundary so core behavior can be tested with a fake worker without downloading OCR assets.
- Add unit tests and package scripts/configuration to support a red-green-refactor workflow.
- Keep the package independent of React, Tauri, and other UI code; do not wire it into the Workbench yet.

## Capabilities

### New Capabilities
- `ocr-middleware`: Local image-to-text recognition API, progress reporting, and worker lifecycle.

### Modified Capabilities
None.

## Impact

- New `packages/ocr-middleware` TypeScript workspace and tests.
- New Tesseract.js runtime dependency and package test dependencies in npm workspace metadata/lockfile.
- No changes to the Workbench UI or app OCR behavior in this change.
