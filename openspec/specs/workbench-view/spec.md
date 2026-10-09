# workbench-view Specification

## Purpose
Provides a focused desktop workspace for viewing a selected project image and entering future image analysis tools, with the project's shared image gallery available in a horizontal layout.

## Requirements

### Requirement: Workbench navigation
The desktop app SHALL provide a Workbench view reachable from the primary view navigation when a project session is active.

#### Scenario: Open Workbench
- **WHEN** the user selects Workbench from the primary navigation
- **THEN** the app displays the Workbench view for the current project images

### Requirement: Selected image workspace
The Workbench SHALL display the selected image prominently in a main image stage beside a tools sidebar, with the image fitted inside the available stage without cropping.

#### Scenario: Display selected image
- **WHEN** an image is selected in the Workbench gallery
- **THEN** the main stage displays that image at the largest size that fits while preserving its aspect ratio

#### Scenario: No image selected
- **WHEN** the project contains images but no image is selected
- **THEN** the main stage prompts the user to select an image from the gallery

#### Scenario: Empty project
- **WHEN** the project contains no images
- **THEN** the Workbench shows an empty state explaining that imported images will appear there

### Requirement: Future tool placeholders
The Workbench SHALL show a sidebar of image tools, including an actionable OCR tool and clearly labeled unavailable future tools such as reverse image search.

#### Scenario: OCR tool shown
- **WHEN** the Workbench is displayed
- **THEN** the sidebar identifies OCR as an available tool with a Run action when a local project image is selected
- **AND** reverse image search remains identified as an unavailable future tool

#### Scenario: OCR tool unavailable without image
- **WHEN** no local project image is selected
- **THEN** the OCR Run action is unavailable

#### Scenario: Future tools shown
- **WHEN** the Workbench is displayed
- **THEN** the sidebar identifies OCR as an available tool and reverse image search as an unavailable future tool
- **AND** activating a tool marked as an unavailable future tool does not launch processing or external navigation

#### Scenario: OCR progress and results
- **WHEN** OCR is running or has saved results for the selected image
- **THEN** the OCR row shows the request progress or offers an action to open the saved results

### Requirement: Reusable gallery orientation
The image gallery SHALL support vertical and horizontal orientations. Existing Map View usage SHALL remain vertical, and Workbench SHALL use a horizontally scrolling gallery along the bottom of the view.

#### Scenario: Select image in horizontal gallery
- **WHEN** the user selects a thumbnail in the Workbench gallery
- **THEN** the thumbnail becomes selected and the main image stage updates to that image

#### Scenario: Keep selected thumbnail visible
- **WHEN** the selected image changes to an item outside the visible horizontal gallery area
- **THEN** the gallery scrolls that item into view

#### Scenario: Preserve map gallery
- **WHEN** the user opens Map View
- **THEN** its gallery remains vertically oriented and selection behavior continues to work

### Requirement: Responsive and accessible Workbench
The Workbench SHALL remain usable at supported desktop window sizes, in both app themes, and with keyboard navigation.

#### Scenario: Keyboard gallery selection
- **WHEN** a user navigates gallery items by keyboard and activates one
- **THEN** the selected image updates and focus remains visibly indicated

#### Scenario: Light theme
- **WHEN** the app uses the light theme
- **THEN** the Workbench surfaces, text, borders, and placeholders remain legible using the app theme tokens
