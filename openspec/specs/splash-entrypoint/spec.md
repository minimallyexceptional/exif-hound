# splash-entrypoint Specification

## Purpose
TBD - created by archiving change splash-screen-entrypoint. Update Purpose after archive.

## Requirements

### Requirement: Splash screen is shown at launch
The application SHALL show a splash screen as its entrypoint on launch. The splash screen MUST occupy the full app window and MUST NOT render any part of the existing app shell (header, uploader, map, gallery) until the user has made an entry choice.

#### Scenario: First launch of the session
- **WHEN** the app starts
- **THEN** the splash screen is displayed as the only visible surface

### Requirement: Splash screen layout — logo and investigations
The splash screen SHALL present a two-region composition:
- **Left region:** a large ExifHound logomark alone (no wordmark, tagline, or other brand content).
- **Right region:** a prominent "Start new investigation" primary action, and beneath it a recent investigations region.

#### Scenario: Composition renders
- **WHEN** the splash screen is displayed
- **THEN** the logomark is visible in the left region, and the primary action and recent investigations region are visible in the right region, with the action positioned above the list region

### Requirement: Start new investigation enters the existing flow
Activation of the new-investigation action SHALL dismiss the splash screen and enter the existing upload entrypoint (the app's current empty-state upload experience), with the recorded session counting as a new investigation.

#### Scenario: User starts a new investigation
- **WHEN** the user activates "Start new investigation"
- **THEN** the splash screen is dismissed and the existing upload empty-state is shown, ready to receive photos

### Requirement: Recent investigations region is a history placeholder
The recent investigations region SHALL list recently saved/opened investigation
files, most recent first, capped at 10 entries. Each entry SHALL show the
investigation name and relative last-opened time, and SHALL be activatable to
resume that investigation (open the file from disk and restore the session).
Entries whose file cannot be opened SHALL surface the same clear error as the
open action and leave the app unchanged; entries are not silently pruned.

#### Scenario: Empty state
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

### Requirement: Theme support
The splash screen SHALL fully support both light and dark themes using the app's existing `data-theme` token system. All colors MUST come from the shared `--app-*` tokens; the logomark SHALL render in theme-appropriate ink (existing theme-aware Logomark behavior). No hardcoded color literals are permitted.

#### Scenario: Dark theme render
- **WHEN** the active theme is dark
- **THEN** the splash screen renders with the dark token palette, logomark in light ink

#### Scenario: Light theme render
- **WHEN** the active theme is light
- **THEN** the splash screen renders with the light token palette, logomark in dark ink

### Requirement: Existing flow untouched
All behavior after the splash screen (upload, map, list, investigation, export/import, settings) MUST remain unchanged. The splash screen MUST NOT alter any downstream requirement or component behavior.

#### Scenario: Regression guard
- **WHEN** the user proceeds past the splash screen
- **THEN** the application behaves exactly as it did before this change

### Requirement: Motion accessibility
Any splash entrance transitions MUST respect `prefers-reduced-motion: reduce` (instant rendering, no animation).

#### Scenario: Reduced motion preference
- **WHEN** the OS reports `prefers-reduced-motion: reduce`
- **THEN** the splash screen renders fully composed with no animated transitions

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
