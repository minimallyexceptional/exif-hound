# Proposal: App-wide Sonner toasts

## Why
Completed actions and failures currently surface through a mix of inline banners, modal alerts, `console.error`, and updater dialogs. Users miss workflow and import failures, and the update-available modal blocks the rest of the app.

## What Changes
- Add a single Sonner toaster at the React root, themed with existing app tokens.
- Fire success and error toasts for image uploads, KML/CSV imports, exports, workflow runs, clipboard copy, and project write/open failures once a session is active.
- Replace updater available, progress, ready, and error dialogs with toasts. Keep the unsaved-work restart confirmation as a dialog.
- Remove the Workbench error banner and the map-view import error banner.
- Keep field and open-modal validation inline (splash, project create, ImportModal parse, image comparison).

## Capabilities
### New Capabilities
- `app-toasts`: app-wide toast feedback for completed actions and updater surfaces.

### Modified Capabilities
- `workbench-workflow`: workflow run success and failure are announced with toasts instead of a Workbench banner.

## Impact
- `apps/exif-hound-desktop`: new `sonner` dependency, toaster, notify helper, Workbench, App, ImageUploader, ExportModal, copy surfaces, updater UI, Playwright specs.
- Splash, project-create, and ImportModal parse alerts stay inline.
