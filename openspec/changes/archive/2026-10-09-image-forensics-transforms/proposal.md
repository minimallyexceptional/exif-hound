# Proposal: Local image forensics transforms

## Why

Workbench workflows can currently recognize ordinary text with OCR, but they cannot surface local file and metadata clues that help investigators triage an image's provenance, nor turn visible text into searchable identifier candidates with spatial evidence. These are useful OSINT and digital-forensics tasks that should work without sending evidence to remote services.

## What changes

- Add a framework-independent `image-forensics-middleware` package for two reusable, local transforms: a provenance/edit-indicator analyzer and a visual text/identifier detector.
- Extend the OCR middleware result additively with word-level confidence and image bounding boxes, so the identifier transform can use the existing OCR engine rather than duplicating OCR behavior.
- Add both transforms to the Workbench catalog and runner. Add an evidence output node for structured findings while retaining the existing Text output for OCR text.
- Persist every transform result in its own append-only project database table with source image, workflow/run, tool/version, status, and run-time details.
- Keep UI components presentation-only and develop package behavior test-first with injected dependencies and deterministic fixtures.

## Scope and safeguards

All image bytes and analysis remain local. The provenance transform reports observable indicators and their supporting fields; it does not label an image authentic, forged, or manipulated. The identifier transform reports text and rule-based candidates with confidence and source coordinates; candidates are not identity claims. License-plate patterns require an explicitly selected regional profile. OCR languages and rule/profile settings are workflow node settings.

## Out of scope

- Remote search, reverse-image lookup, face recognition, person identification, or external enrichment.
- Image resizing/cropping or other generic image-edit operations.
- Claims that a metadata absence, editor tag, recompression clue, or identifier candidate proves tampering or identity.
- Changes to the existing OCR node's visible result contract beyond preserving its current text/confidence display.

## Approval

This proposal must be approved before implementation tasks are generated or application/package code is changed.
