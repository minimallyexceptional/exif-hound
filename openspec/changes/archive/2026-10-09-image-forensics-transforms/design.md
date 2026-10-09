# Design: Local image forensics transforms

## Package boundaries

Add `packages/image-forensics-middleware`, a TypeScript package with no React, Tauri, DOM, project-database, or workflow-canvas dependency. It owns the domain inputs/results, provenance rules, identifier rules, normalization, and lifecycle. Its production adapters use local image bytes and existing project metadata; dependencies that are difficult to exercise deterministically (metadata parsing, image structure inspection, OCR, and time) are injected behind small interfaces. Tests use fakes and checked-in byte/metadata fixtures, so they do not need WASM assets, native desktop services, or external requests.

The package exposes two separately testable services:

- `ImageProvenanceAnalyzer`: returns normalized image facts and a list of traceable indicators. Initial indicators cover explicit editing-software metadata, conflicting or chronologically inconsistent capture/modify timestamps, missing/stripped metadata context, and JPEG/container structure facts such as quantization-table fingerprints and scan/frame markers when available. Each indicator includes a stable code, severity, explanation, and supporting field/value references. An indicator is never a binary tampering verdict.
- `VisualIdentifierDetector`: calls an injected OCR provider and maps word-level text, confidence, and bounding boxes into visible-text entries and rule-based candidates. Initial rules cover email addresses, URLs/domains, phone-like strings, coordinate pairs, and license-plate-like strings only when a regional format profile is explicitly selected. Each candidate links to its originating OCR words and bounding box. It never claims an identifier belongs to a person.

### OCR contract

Extend `OcrResult` with an additive `words` collection. Each word has text, confidence normalized to 0–100, and a normalized image-space bounding box (`x`, `y`, `width`, `height`) using coordinates in the range 0–1. Existing `text` and `confidence` fields and empty-result behavior remain unchanged. Tesseract's word bounding boxes are normalized against its image dimensions. Fake-worker tests continue to avoid Tesseract assets. The desktop must configure local worker/core/language resources for offline workflow use; neither transform may introduce a remote service call.

## Workflow integration

Catalog additions:

- Transforms: **Image Provenance**, **Visual Text & Identifiers**.
- Outputs: **Evidence Report** (structured findings and candidate text with source-image coordinates). Existing **Text** remains the plain OCR output.

Image Provenance accepts an Image edge and emits an evidence report. Visual Text & Identifiers accepts an Image edge and emits an evidence report; its settings include OCR languages, enabled candidate families, and an optional license-plate region profile. OCR can remain in a pipeline as its own explicit transform; the visual-identifier transform uses the same OCR middleware API internally when it needs token boxes. Both transforms receive normal typed workflow-run context and return serializable results through the existing runner. UI nodes only render supplied state and settings actions; handlers, validation, scheduling, persistence mapping, and analysis remain in testable packages.

The Evidence Report output is inspection-only. It displays saved findings with source image name/ID, signal/candidate, confidence when supplied, evidence fields or OCR bounding box, tool/version, and run time; it can copy selected text/value. Selecting or copying it never runs a transform.

## Persistence

Add project schema tables `image_provenance_results` and `visual_identifier_results`; both are append-only so repeated runs retain history. Each row references the source image and workflow run, records transform version, status, start/finish times and tool-specific structured JSON, and includes a workflow node identifier to distinguish repeated instances. Provenance rows store the normalized facts and indicator list. Identifier rows store OCR text, OCR confidence, normalized word boxes, enabled rules/profile, and matched candidates. Successful empty analyses are stored as successful rows with empty findings/candidates. Failed analysis rows preserve error status/message and do not erase previous successful results. Migrations are idempotent and preserve existing project and OCR data.

## Failure and evidence handling

Malformed or unsupported image data rejects with a typed, user-readable analysis error; the workflow records the failed step and retains completed prior step results. Partial metadata or unsupported container details produce explicit unavailable fields rather than guessed values. Database write failure fails that workflow step. Raw image bytes are not copied into transform tables. Results identify algorithm/package version for later interpretation.

## Verification

Use red-green-refactor tests first for metadata conflicts, edited-software signals, JPEG marker/table parsing, unavailable fields, OCR word normalization, candidate rules and bounding-box association, locale-gated plate patterns, empty text, progress/failure/disposal, persistence migrations and append-only history, handler ordering, graph validation, and output inspection/copy. Add focused desktop component and integration coverage for settings, active-node progress, evidence output, light/dark rendering, and no accidental execution from output inspection. Run package tests/typecheck/lint/build, desktop gates, and `openspec validate --all` before archive.
