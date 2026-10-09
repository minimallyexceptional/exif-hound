## MODIFIED Requirements

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
