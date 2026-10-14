# Proposal: All images input + serial batch queue

## Why
Investigators often need the same workflow (OCR, provenance, identifiers) applied to every photo in a project. Today each Image node binds one `imageId`, forcing manual re-runs or duplicate graphs.

## What Changes
- New **All images** input node (`all-images`) with an **Active** toggle in the inspector.
- When Active and connected as the image source for transforms, **Run workflow** enqueues one full run per project image and executes runs **strictly one at a time**.
- Each image gets its own **WorkflowRunRecord** and persisted tool results (same as single-image runs).
- Batch failures **stop after the first failed image** (remaining images are not run).

## Capabilities
### Modified Capabilities
- `workbench-workflow`: node type, validation, batch planning, serial queue, Workbench UI.

## Impact
- `packages/workbench-workflow`: workflow schema, batch helpers, queue, tests.
- `apps/exif-hound-desktop`: catalog, canvas node, inspector, run orchestration, toasts.

## Out of Scope
- Cross-project or cross-workflow global queue.
- Cancel-in-progress UI for v1.
- DB schema changes for batch grouping.
