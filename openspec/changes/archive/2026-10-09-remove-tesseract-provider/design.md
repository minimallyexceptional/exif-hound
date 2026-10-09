# Design

## Context

OCR middleware currently supports Tesseract and PaddleOCR. PaddleOCR is the selected engine for new work; Tesseract remains the middleware default and is exposed in the OCR inspector. Both model/runtime paths are packaged locally.

## Decisions

- Keep the common OCR result fields and Paddle worker lifecycle, but reduce the active provider type and implementation to PaddleOCR.
- Remove the Tesseract package dependency and desktop asset-copy logic for its worker, core, and language data.
- Remove the OCR provider selector. Normalize `tesseract` and missing provider values in old workflow graphs to `paddle` before workflow execution and serialization.
- Retain Tesseract as a historical database attribution value only. Do not rewrite historical rows or change the database schema.
- Keep Paddle model and WASM assets lazy-loaded and local, with no remote fallback.

## Risks

- Old workflows explicitly set to Tesseract need normalization to avoid becoming invalid.
- Historical result types must continue to accept and display Tesseract even though the active provider type no longer includes it.
- Removing Tesseract assets reduces install size but must not remove resources still used by the Visual Text & Identifiers node, which already uses PaddleOCR.

## Validation

- Add middleware tests proving Paddle is the default and Tesseract requests fail explicitly.
- Add workflow tests for legacy setting normalization and provider-free new OCR nodes.
- Add Workbench tests that verify the selector is absent, legacy settings normalize, and OCR runs call Paddle.
- Run relevant package tests/typechecks, desktop checks, and the Paddle offline browser smoke test.
