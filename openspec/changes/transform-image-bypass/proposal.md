# Proposal: Transform image bypass + data output

## Why
Analysis transforms are currently dead-ends: each has one image input and one result output. Users cannot pass the same prepared image from OCR into Provenance or Text & Identifiers. They must add a second Image node even when reviewing one photo.

## What Changes
- Every transform (OCR, Image Provenance, Text & Identifiers) keeps an image input and gains an image bypass output plus its existing typed data output (`text` or `evidence`).
- Canvas handles show **Image** and **Data** labels; port IDs stay `image` / `text` / `evidence` so saved graphs remain valid.
- The runner routes payloads by `sourcePort` so the bypass carries the image packet and the data port carries the analysis result.
- Runnable validation walks the image chain back to an Image node with a chosen `imageId`. Data-out to the matching sink remains required.

## Capabilities
### New Capabilities
- None. This extends the existing `workbench-workflow` capability.

### Modified Capabilities
- `workbench-workflow`: transform port map, connection validation, runner routing, and canvas handles.

## Impact
- `packages/workbench-workflow`: ports, validation, runner, handlers, package tests.
- `apps/exif-hound-desktop`: NodeFrame multi-output handles, transform node copy, Workbench tests.
- Existing project workflows and machine templates keep working; unused image-out handles appear on transforms.
