# splash-entrypoint — Specification (delta)

## MODIFIED Requirements

### Requirement: Recent investigations region is a history placeholder
The recent investigations region SHALL list recently saved/opened investigation
files, most recent first, capped at 10 entries. Each entry SHALL show the
investigation name and relative last-opened time, and SHALL be activatable to
resume that investigation (open the file from disk and restore the session).
Entries whose file cannot be opened SHALL surface the same clear error as the
open action and leave the app unchanged; entries are not silently pruned.

#### Scenario: No history yet
- **WHEN** no investigations have been saved or opened
- **THEN** the region shows its empty state inviting the user to start their first investigation

#### Scenario: History exists
- **WHEN** at least one investigation has been saved or opened
- **THEN** its entry appears with name and relative time, most recent first, and activating it resumes that investigation

#### Scenario: Cap enforcement
- **WHEN** more than 10 investigations appear in the history
- **THEN** only the 10 most recent are listed

#### Scenario: Resuming an entry
- **WHEN** the user activates a recent entry
- **THEN** the splash screen is dismissed and the app restores that investigation's images and metadata

#### Scenario: Entry file missing
- **WHEN** the user activates an entry whose file no longer exists or cannot be read
- **THEN** an error naming the problem is surfaced and the splash screen remains

## ADDED Requirements

### Requirement: Open investigation action
The splash screen SHALL provide an "Open investigation…" action alongside the
new-investigation action. Activating it opens a file dialog filtered to
`.investigation` files; a chosen file opens and restores the session. Cancelling
the dialog is a silent no-op that keeps the splash screen shown.

#### Scenario: Open via splash
- **WHEN** the user activates "Open investigation…" and chooses a valid `.investigation` file
- **THEN** the splash screen is dismissed and the app restores that investigation's session

#### Scenario: Open cancelled
- **WHEN** the user cancels the open dialog
- **THEN** the splash screen remains and no state changes

### Requirement: Saved and opened investigations enter the history
Saving an investigation (from the app) and opening one (via dialog or recent
entry) SHALL record the file path, investigation name, and last-opened time in
the tracked history used by the splash list. History is capped at 10 entries,
most-recent-first.

#### Scenario: Save records history
- **WHEN** the user saves an investigation to a chosen path
- **THEN** an entry with that path, investigation name, and the current time
  appears at the top of the history