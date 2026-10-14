# Proposal: Canonical per-image workflow evidence

## Why
Re-running Workbench workflows on the same image appends duplicate OCR, identifier, and provenance rows. The Evidence hub and project-wide lists inflate counts and show repeated items.

## What Changes
- One canonical row per project image in each tool result table (`ocr_results`, `visual_identifier_results`, `image_provenance_results`).
- Same-workflow re-run replaces that image’s row; different workflows merge extracted JSON (OCR keeps best confidence).
- Schema v8 migration compacts existing duplicates. `workflow_runs` stays append-only.

## Impact
- `packages/investigation-archive`: merge helpers, upsert in `ProjectStore`, migration v8.
- `apps/exif-hound-desktop`: defensive dedupe in `buildEvidenceIndex`; Workbench list APIs unchanged at call sites.

## Out of Scope
- Normalized `evidence_items` table.
- Removing historical workflow run records.
