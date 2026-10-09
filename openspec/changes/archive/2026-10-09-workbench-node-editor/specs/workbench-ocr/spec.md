## MODIFIED Requirements

### Requirement: Run OCR on a selected project image
The Workbench SHALL run OCR through the local middleware for each project image on a valid connected workflow path when the user activates Run Workflow.

#### Scenario: Start OCR
- **WHEN** the user activates Run Workflow for a connected Image, OCR, and Text path with a project image selected
- **THEN** the app recognizes text from that image through the existing OCR middleware
- **AND** associates the run with that path's Text output node

#### Scenario: No eligible image
- **WHEN** the user activates Run Workflow and a connected Image node has no selected local project image
- **THEN** the app does not run OCR for that path and identifies the missing image selection

#### Scenario: Duplicate run
- **WHEN** a workflow run is already in progress
- **THEN** another Run Workflow action is unavailable until the current run completes or fails

### Requirement: Show OCR progress and status
The Workbench SHALL show progress and completion or failure state on the OCR node while a workflow is running.

#### Scenario: Recognition in progress
- **WHEN** the OCR middleware reports progress
- **THEN** the OCR node displays an accessible progress indicator for its active request

#### Scenario: Recognition succeeds
- **WHEN** recognition returns text and the OCR result is appended to the project database
- **THEN** the OCR node indicates completion and its connected Text node can display the saved result

#### Scenario: Recognition fails
- **WHEN** the OCR middleware or result persistence operation fails
- **THEN** the graph remains usable, the failed OCR node shows an error, and the user can retry the workflow

### Requirement: Handle empty OCR results on the Workbench
The Workbench SHALL show a clear empty result on the connected Text output when recognition returns no text.

#### Scenario: No text recognized
- **WHEN** recognition completes with empty or whitespace-only text
- **THEN** the user remains on the workflow canvas and the connected Text output inspector explains that no text could be extracted
- **AND** the run is recorded as successful with a no-text result row in the OCR results table

### Requirement: Review and copy OCR results
The Workbench SHALL display recognized text in the inspector for a selected Text output node and provide a copy action for each result entry.

#### Scenario: Open results
- **WHEN** the user selects a Text output node connected to an OCR node with saved results
- **THEN** the right-side inspector displays the source image name and ID, recognized text, available confidence metadata, and run time

#### Scenario: Copy result entry
- **WHEN** the user activates Copy for a displayed OCR result entry
- **THEN** the app copies that entry's text to the system clipboard and gives visible confirmation

#### Scenario: Return to Workbench
- **WHEN** the user switches away from Workbench and later returns to it
- **THEN** the workflow and its saved OCR results remain available

#### Scenario: Reopen saved output
- **WHEN** a project with a saved workflow and OCR results is reopened
- **THEN** selecting the connected Text output node displays saved results for its source image and the latest workflow run details

#### Scenario: Select a Text node without a result
- **WHEN** the user selects a Text output node that has no completed OCR result
- **THEN** the inspector prompts the user to run a connected workflow
