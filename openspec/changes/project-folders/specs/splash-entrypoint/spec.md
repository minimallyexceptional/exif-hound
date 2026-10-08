# splash-entrypoint — Specification (delta)

## MODIFIED Requirements

### Requirement: Open investigation action
The splash screen SHALL provide an "Open existing project" action alongside
the new-investigation action. Activating it opens a **folder picker**; the
selected folder is validated (per `project-store`'s "Open existing project
validates the folder") and opened when valid. Cancelling the picker is a
silent no-op that keeps the splash screen shown.

#### Scenario: Open via splash
- **WHEN** the user activates "Open existing project" and selects a valid project folder
- **THEN** the splash screen is dismissed and the app loads the project with views repopulated from its database

#### Scenario: Open cancelled
- **WHEN** the user cancels the folder picker
- **THEN** the splash screen remains and no state changes

#### Scenario: Invalid folder rejected
- **WHEN** the user selects a folder that is not a valid project
- **THEN** an error naming the problem is shown and the splash screen remains

## REMOVED Requirements

- None. (The "Saved and opened investigations enter the history" requirement
  carries over as project-folder history via `project-store`'s "Recent
  projects are project folders".)