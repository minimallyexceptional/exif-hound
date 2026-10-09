# Proposal

## Why

Users need a focused place to inspect one image at a time and later launch image analysis tools without losing their place in the dataset. The workbench establishes that workspace now, while leaving tool execution for future feature work.

## What Changes

- Add a Workbench view reachable from the desktop app's primary view navigation.
- Show the selected image prominently in the main work area, with a tool sidebar alongside it.
- Populate the sidebar with clearly labeled placeholder entries for future tools such as OCR and reverse image lookup; entries do not launch or simulate tools.
- Reuse the existing image gallery at the bottom of the Workbench and add a horizontal orientation while preserving its existing vertical use in Map View.
- Selecting an image in the Workbench gallery updates the large image in the main work area.
- Provide useful empty and no-selection states consistent with the current desktop design system.

## Capabilities

### New Capabilities
- `workbench-view`: Workbench navigation, selected-image workspace, tool placeholders, and horizontal gallery behavior.

### Modified Capabilities
None.

## Impact

- Desktop view routing and primary navigation in `apps/exif-hound-desktop`.
- Shared `ImageGallery` presentation to support vertical and horizontal orientations.
- New Workbench view component and associated unit or UI coverage.
- No new dependencies, persistence behavior, OCR, reverse image search, or other image-processing behavior.
