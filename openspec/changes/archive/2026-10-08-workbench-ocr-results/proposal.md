# Proposal: Workbench OCR results

## Why
The Workbench currently presents OCR as a future tool, while the app now has a UI-independent OCR middleware package. Users need a clear way to run recognition on a project image, see progress, keep results with the project, and review or copy recognized text later.

## What Changes
- Turn the Workbench OCR placeholder into an actionable tool with per-image progress and result availability.
- Persist successful OCR output with its source image in the project database.
- Add a full-screen OCR results view with copy controls and a no-text dialog on the Workbench.
- Extend project database migration behavior so existing projects can gain OCR storage without losing image data.

## Capabilities
### New Capabilities
- `workbench-ocr`: Run OCR from Workbench, persist output by source image, and review/copy stored results.

### Modified Capabilities
- `workbench-view`: Replace the inactive OCR placeholder behavior with a runnable OCR action, progress state, and result navigation.

## Impact
- `apps/exif-hound-desktop`: Workbench tool row, OCR execution state, results screen/dialog, project session integration.
- `packages/investigation-archive`: schema migration and methods for associating OCR output with a project image.
- `packages/ocr-middleware`: consumed by the desktop OCR workflow; its whole-text result contract remains sufficient for this proposal.
