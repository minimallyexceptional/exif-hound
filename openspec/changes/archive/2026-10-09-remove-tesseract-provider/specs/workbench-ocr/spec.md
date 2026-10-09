## MODIFIED Requirements

### Requirement: Choose an OCR provider on each OCR node
The Workbench SHALL run PaddleOCR for every OCR node and SHALL NOT expose a provider selector.

#### Scenario: Configure PaddleOCR
- **WHEN** a workflow is run with an OCR node configured for PaddleOCR
- **THEN** that node uses PaddleOCR
- **AND** the setting remains in workflow data

#### Scenario: Configure Tesseract
- **WHEN** an OCR node has a saved Tesseract provider setting
- **THEN** the Workbench normalizes it to PaddleOCR before running

#### Scenario: Load a workflow without provider setting
- **WHEN** the Workbench loads an OCR node without a provider setting
- **THEN** it treats the node as configured for PaddleOCR
- **AND** saves the normalized setting with the workflow

#### Scenario: Keep node settings presentation-only
- **WHEN** the user works with an OCR node
- **THEN** provider execution remains in the OCR middleware

#### Scenario: Load a legacy Tesseract workflow
- **WHEN** the Workbench loads an OCR node whose saved provider is Tesseract or is missing
- **THEN** it normalizes the node to PaddleOCR
- **AND** saves the normalized setting with the workflow

### Requirement: Persist OCR provider attribution
The project database SHALL record PaddleOCR and its available model or engine version for each new OCR result while preserving historical provider attribution for existing rows.

#### Scenario: Save OCR result attribution
- **WHEN** PaddleOCR returns text or a successful no-text result
- **THEN** the project database stores PaddleOCR and the available model or engine version with the result
- **AND** the result remains associated with its image, workflow run, and OCR node

#### Scenario: Review provider comparison results
- **WHEN** the user opens a Text output node containing earlier OCR results
- **THEN** each result displays its original provider and available model or engine version

#### Scenario: Migrate existing OCR results
- **WHEN** the app opens a project database with existing OCR result rows
- **THEN** it preserves those rows, their provider attribution, and all existing OCR data

#### Scenario: Review historical results
- **WHEN** the user opens a Text output node containing earlier Tesseract results
- **THEN** each historical result retains and displays its original Tesseract attribution
