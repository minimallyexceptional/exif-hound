# Proposal: Evidence hub view

## Why
Workbench runs produce identifiers, OCR text, and provenance across many images, but results are only visible per workflow node. Investigators need a single project-wide place to browse and jump to source images.

## What Changes
- New **Evidence** app view with a bento dashboard (counts per evidence type).
- Drill-down tables listing every extracted item with confidence, source image, and run metadata.
- Project-wide read APIs on the investigation archive (no schema migration in v1).

## Impact
- `packages/investigation-archive`: listProject* store methods.
- `apps/exif-hound-desktop`: Evidence UI, shared VirtualDataGrid, navigation/session.

## Out of Scope
- Normalized `evidence_items` table (v2).
- Cross-project search.
