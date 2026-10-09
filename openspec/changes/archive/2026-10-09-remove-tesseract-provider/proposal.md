# Proposal: Remove Tesseract OCR provider

## Why

PaddleOCR has become the preferred OCR engine for the project's image set. Keeping a second provider increases app size and maintenance work without adding value to current workflows.

## What Changes

- Make PaddleOCR the sole OCR middleware implementation and default.
- Remove the OCR provider selector from OCR nodes and normalize legacy workflow settings that name Tesseract to PaddleOCR.
- Remove Tesseract packages and copied runtime assets from the desktop app.
- Keep already stored OCR results readable and preserve their original provider attribution, including historical Tesseract results.
- Keep the Text & Identifiers node on PaddleOCR.

PaddleOCR becomes the only engine available for new OCR work in Exif Hound. The Tesseract runtime, dependencies, packaged language/core assets, and selectable Workbench option are removed.

## Compatibility

Existing workflows without a provider setting continue to run using PaddleOCR. Workflows saved with `provider: "tesseract"` are treated as PaddleOCR when run and are saved back in normalized form. Project database rows that record Tesseract remain unchanged and visible as historical Tesseract results. New OCR results can only be attributed to PaddleOCR.

## Non-goals

- Rewriting or deleting historical OCR database rows.
- Changing OCR result schema or other workflow node behavior.
- Changing PaddleOCR models or the local offline runtime.
