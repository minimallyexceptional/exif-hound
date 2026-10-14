## Purpose
Provides a single themed toast host for completed actions, failures, and updater progress so users are not blocked by banners or modal alerts.

## ADDED Requirements

### Requirement: App-wide toast host
The desktop app SHALL mount one themed toast host for the splash screen and the active project session.

#### Scenario: Toaster is present
- **WHEN** the app renders
- **THEN** a toast host is available at the bottom-right and uses existing app color tokens for light and dark themes

### Requirement: Completed-action toasts
The app SHALL announce successful and failed completed actions with toasts, using one summary toast for a batch.

#### Scenario: Import images
- **WHEN** the user uploads one or more images and processing finishes
- **THEN** the app shows a success toast for imported images or an error toast if some or all images could not be processed

#### Scenario: Import KML or CSV
- **WHEN** a KML or CSV file is imported successfully
- **THEN** the app shows a success toast
- **AND** parse errors that occur while the import modal is open remain inline in that modal

#### Scenario: Export data
- **WHEN** the user exports CSV or JSON
- **THEN** a success toast is shown and the export modal closes
- **AND** a failed save shows an error toast and leaves the modal open

#### Scenario: Copy to clipboard
- **WHEN** the user copies EXIF, OCR, or evidence text
- **THEN** a success toast is shown on success and an error toast is shown if clipboard access fails

#### Scenario: Project write failure
- **WHEN** an image cannot be saved to the open project
- **THEN** the app shows an error toast

### Requirement: Updater toasts
The updater SHALL use persistent or loading toasts instead of available, progress, ready, and error dialogs. Unsaved-work confirmation before restart SHALL remain a dialog.

#### Scenario: Update is available
- **WHEN** a check finds an update and the user has not dismissed that version
- **THEN** a persistent toast shows the version, an Install action, and a close control
- **AND** closing the toast does not start a download
- **AND** Install starts the download

#### Scenario: Update is downloading
- **WHEN** an update is downloading, installing, or restarting
- **THEN** a loading toast reports the phase and download percent when known
- **AND** that toast cannot be dismissed until the phase ends

#### Scenario: Update is ready
- **WHEN** a verified update is ready to install
- **THEN** a persistent toast offers Restart & Update
- **AND** if the session has unsaved work the app confirms in a dialog before restarting
- **AND** if the session has no unsaved work the app installs and restarts

#### Scenario: Visible update error
- **WHEN** a user-initiated update operation fails
- **THEN** an error toast shows the user-facing message
- **AND** silent automatic check failures remain invisible
