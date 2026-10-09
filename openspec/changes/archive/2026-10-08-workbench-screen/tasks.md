# Tasks

## 1. Shared gallery orientation

- [x] 1.1 Add vertical and horizontal gallery layouts with orientation-aware virtualization, selected-image scrolling, and preserved Map View defaults; verify existing vertical usage remains unchanged by default and horizontal sizing is bounded to the strip.
- [x] 1.2 Keep gallery selection accessible in both orientations; verify gallery items remain labeled, keyboard activatable, and expose selected state.

## 2. Workbench surface and navigation

- [x] 2.1 Add the Workbench screen with an image stage, future tool placeholders, bottom horizontal gallery, and empty/no-selection/image-error states; verify each state is represented by visible UI.
- [x] 2.2 Add Workbench to desktop and mobile navigation and wire it to shared project image selection; verify switching views and gallery selection update the displayed image.
- [x] 2.3 Update the OpenSpec change artifacts with implementation details and completed task status; verify `openspec validate workbench-screen` passes.

## 3. Integration verification

- [x] 3.1 Run desktop typecheck and lint for changed code, then verify the final diff contains only Workbench feature changes.
