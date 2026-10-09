## MODIFIED Requirements

### Requirement: Selected image workspace
The Workbench SHALL provide a full-width node workflow canvas between a node catalog and a contextual inspector.

#### Scenario: Display selected image
- **WHEN** the user opens Workbench
- **THEN** the app displays a left node catalog, an open central canvas, and a right-side inspector

#### Scenario: No image selected
- **WHEN** the user selects a project image in an Image node's settings
- **THEN** that image is previewed above the Image node on the canvas

#### Scenario: Empty project
- **WHEN** the project contains no images
- **THEN** the Workbench explains that imported project images can be selected in an Image node

### Requirement: Future tool placeholders
The Workbench SHALL present workflow nodes in categorized Inputs, Transforms, and Outputs groups.

#### Scenario: OCR tool shown
- **WHEN** the Workbench is displayed
- **THEN** the catalog offers Image in Inputs, OCR in Transforms, and Text in Outputs

#### Scenario: OCR tool unavailable without image
- **WHEN** the initial Workbench node catalog is displayed
- **THEN** reverse image search and similarity matching are not listed as available nodes

#### Scenario: Future tools shown
- **WHEN** the user selects a node
- **THEN** its settings or output appears in the right-side inspector

#### Scenario: OCR progress and results
- **WHEN** an OCR node is running or has saved results for a connected Text node
- **THEN** the OCR node shows its execution state and the Text node can display those results

### Requirement: Reusable gallery orientation
The shared image gallery SHALL use a vertical orientation in Map View, and Workbench SHALL select project images through Image node settings without displaying a gallery.

#### Scenario: Preserve map gallery
- **WHEN** the user opens Map View
- **THEN** its image gallery remains vertically oriented and selection behavior continues to work

#### Scenario: Select image in horizontal gallery
- **WHEN** the user selects an image in an Image node's project-image selector
- **THEN** that Image node updates to show the selected image preview

#### Scenario: Keep selected thumbnail visible
- **WHEN** the user opens Workbench
- **THEN** the page uses the canvas for the full work area and does not show a horizontal bottom gallery

### Requirement: Responsive and accessible Workbench
The workflow editor SHALL remain usable at supported desktop window sizes, in both app themes, and with keyboard navigation.

#### Scenario: Keyboard gallery selection
- **WHEN** a user navigates the node catalog and canvas by keyboard
- **THEN** node focus and selection remain visibly indicated and the selected node's inspector can be reached

#### Scenario: Light theme
- **WHEN** the app uses the light theme
- **THEN** the Workbench catalog, canvas, nodes, connections, and inspector remain legible using the app theme tokens
