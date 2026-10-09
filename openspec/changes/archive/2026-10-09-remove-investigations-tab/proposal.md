# Proposal

## Why

The legacy Investigation tab duplicates analysis entry points and is being replaced by the Workbench workflow editor. Removing the tab and its dashboard-only implementation reduces maintenance while keeping project management, shared metadata views, and Workbench analysis intact.

## What Changes

- **BREAKING:** Remove the Investigation navigation item, mobile menu entry, view, dashboard, and its analysis panels.
- Remove `exif-insights` and other code used only by the Investigation dashboard.
- Remove the Investigation-only feature flag and its build, test, and contributor-documentation plumbing because no other gated feature remains.
- Stop persisting Investigation-only selected-tool state. When opening an existing project whose saved view is `investigation`, open the Workbench instead.
- Preserve Map, List, Workbench, project folder/archive persistence, OCR and forensic middleware, saved workflows, and all Workbench nodes and output behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `investigations-dashboard`: remove the retired dashboard and its analysis requirements.
- `feature-flags`: remove the feature-gating mechanism that was used only by the retired tab.
- `investigation-persistence`: keep project persistence while adapting restoration of the removed view and omitting its selected-tool state.

## Impact

The desktop header, mobile navigation, app view state and rendering, project session serialization, desktop package dependencies and Vite/Turbo build configuration are affected. The `exif-insights` workspace package and its tests are removed. Project archive and Workbench packages remain, including their database schema and stored analysis results. Existing projects remain readable; projects saved in the removed view reopen in Workbench.
