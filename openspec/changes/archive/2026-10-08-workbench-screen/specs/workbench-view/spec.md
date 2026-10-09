# Workbench View

## ADDED Requirements

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
The Workbench SHALL show a sidebar of clearly labeled future image tools, including OCR and reverse image search, without presenting those entries as functional tools.

#### Scenario: Future tools shown
- **WHEN** the Workbench is displayed
- **THEN** the sidebar identifies OCR and reverse image search as unavailable future tools
- **AND** activating a placeholder does not launch processing or external navigation

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
