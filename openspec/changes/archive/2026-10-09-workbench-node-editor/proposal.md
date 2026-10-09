# Proposal

## Why

The current Workbench is a selected-image viewer with a tool list and a separate results screen. A node workflow gives users a flexible space to compose image analysis, inspect each step, and connect extracted text to a dedicated output.

## What Changes

- Replace the current Workbench content with a full-width workflow editor: a left node catalog, an infinite center canvas, and a contextual settings/results sidebar on the right.
- Add Image input, OCR transform, and Text output nodes with compatible left-to-right connections. Selecting an Image node lets the user choose a project image and shows its preview above the node.
- Treat each graph as a named workflow; let users create and switch between workflows within a project, and save each graph with its project.
- Let users save a workflow as a reusable JSON file in `~/.exif-hound/workflows` (using the OS-resolved home directory), prompt for its name, and browse machine-wide saved workflows in a second Workbench tab. Opening a saved workflow copies its graph into the active project and clears project-specific image selections so the user can choose images from that project.
- Add a Run Workflow action at the top right. A run executes the connected pipeline in dependency order, shows overall progress beside the action, and highlights the node currently processing.
- Persist each tool's output after that step completes in a dedicated tool-results table. For OCR, append the image identity, extracted text, confidence, workflow/node/run identity, and processing time to the OCR results table; retain run status and timing history for each workflow.
- Make output nodes inspection-only: selecting a Text output node displays results from its connected processing node and lets users copy values.
- Restore the shared image gallery to vertical-only behavior for Map View; remove the horizontal gallery arrangement from Workbench.
- Keep the OCR middleware package and its public API unchanged.
- Keep node UI components reusable and presentation-focused; place workflow orchestration and node processing logic in separate, independently testable packages, developed test-first.
- Keep the feature compatible with the current release targets: Linux x86_64 and ARM64, macOS Apple Silicon, and Windows x86_64. Use platform-neutral workflow JSON/database formats, native path resolution, and dependencies supported by every target.

## Capabilities

### New Capabilities

- `workbench-workflow`: Create, connect, configure, run, and persist the Workbench node graph.

### Modified Capabilities

- `workbench-view`: Replace the selected-image stage, tool sidebar, and bottom gallery layout with the node workflow editor; make the shared gallery vertical-only.
- `workbench-ocr`: Move OCR execution and result review into workflow nodes and the contextual sidebar.

## Impact

- `apps/exif-hound-desktop`: Replace the Workbench screen, add custom workflow nodes and node settings, expose workflow state to the active project, and update Workbench navigation tests.
- `packages/investigation-archive`: Persist multiple workflows and workflow-run history per project, append tool results, and migrate existing schema v3 projects without losing images, metadata, session state, or OCR history.
- `apps/exif-hound-desktop/package.json` and lockfile: Add `@xyflow/react` for the canvas and connection editor.
- `packages/ocr-middleware`: Reuse the current API without changing its implementation or contract.
- `packages/workbench-workflow`: Add testable graph validation, serialization, typed node contracts, and pipeline orchestration, with node processing implementations kept outside the UI.
