## Purpose
Defines the Workbench OCR workflow, including progress, project persistence, empty-result handling, and review and copy actions for recognized text.

## ADDED Requirements

### Requirement: Run OCR on a selected project image
The Workbench SHALL allow a user to start OCR for the currently selected project image using the local OCR middleware.

#### Scenario: Start OCR
- **WHEN** the user activates Run on the OCR tool for a selected project image
- **THEN** the app starts recognition for that image without blocking other Workbench interactions
- **AND** the request remains associated with the image selected when it started

#### Scenario: No eligible image
- **WHEN** no project image is selected or the selected item has no local image data
- **THEN** the Run action is unavailable

#### Scenario: Duplicate run
- **WHEN** OCR is already running for the selected image
- **THEN** the user cannot start a duplicate OCR request for that image

### Requirement: Show OCR progress and status
The OCR tool row SHALL communicate recognition progress and completion state for the selected image.

#### Scenario: Recognition in progress
- **WHEN** the OCR middleware reports progress
- **THEN** the tool row displays a progress bar and accessible progress value for that request

#### Scenario: Recognition succeeds
- **WHEN** recognition returns non-empty text and that result is saved
- **THEN** the tool row indicates that results are available and provides an action to open them

#### Scenario: Recognition fails
- **WHEN** the OCR middleware or persistence operation fails
- **THEN** the Workbench remains usable and presents an error state that allows the user to retry

### Requirement: Persist OCR results with source images
The project database SHALL store each successful non-empty OCR result with a stable reference to the project image from which it was extracted.

#### Scenario: Save recognized text
- **WHEN** OCR returns non-empty text for an image in an open project
- **THEN** the app stores the text and available confidence metadata in that project's database
- **AND** the stored result references the source image independently of the current gallery selection

#### Scenario: Reopen project
- **WHEN** a project containing OCR results is reopened
- **THEN** stored results remain associated with their source images and can be opened from the Workbench

#### Scenario: Upgrade an existing project
- **WHEN** the app opens a supported project database that predates OCR storage
- **THEN** it migrates the database to add OCR storage while preserving existing project images and metadata

### Requirement: Handle empty OCR results on the Workbench
The app SHALL keep the user on the Workbench and explain when OCR completes without recognizing text.

#### Scenario: No text recognized
- **WHEN** recognition completes successfully with empty or whitespace-only text
- **THEN** the app stays on the Workbench and opens a dialog explaining that no text could be extracted
- **AND** it does not create an empty OCR result record

### Requirement: Review and copy OCR results
The app SHALL provide a full-screen OCR results view for a selected source image, with a copy action for each displayed result entry.

#### Scenario: Open results
- **WHEN** the user opens available OCR results from the Workbench tool row
- **THEN** the app displays the source image identity and its recognized text in a full-screen OCR view

#### Scenario: Copy result entry
- **WHEN** the user activates Copy for a displayed recognized-text entry
- **THEN** the app copies that entry's text to the system clipboard and gives visible confirmation

#### Scenario: Return to Workbench
- **WHEN** the user leaves the OCR results view
- **THEN** the app returns to the Workbench with the same source image selected
