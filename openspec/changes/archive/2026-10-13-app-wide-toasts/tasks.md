# Tasks

## 1. Toast shell

- [x] 1.1 Add `sonner`, `notify` helper, `AppToaster`, token CSS, and unit tests.
- [x] 1.2 Mount `AppToaster` in `main.tsx` inside `ThemeProvider`.

## 2. Updater

- [x] 2.1 Replace available, progress, ready, and error dialogs with toasts; keep unsaved-work confirmation as a dialog.
- [x] 2.2 Update `UpdateNotification` unit tests.

## 3. Workbench and app actions

- [x] 3.1 Remove the Workbench error banner; toast run success/fail, save/load errors, and clipboard copy.
- [x] 3.2 Toast image upload, KML/CSV import success, export, project write failures, and clipboard on other views. Remove the import error banner.

## 4. E2E and validation

- [x] 4.1 Update Playwright updater, export-import, and upload specs.
- [x] 4.2 Run desktop unit tests and `openspec validate --all`.
