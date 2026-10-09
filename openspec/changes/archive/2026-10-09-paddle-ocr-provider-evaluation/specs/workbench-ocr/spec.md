# Spec Delta

## ADDED Requirements

### Requirement: Choose an OCR provider on each OCR node
The Workbench SHALL let users choose Tesseract or PaddleOCR in the selected OCR node's settings, with Tesseract as the default provider.

#### Scenario: Configure PaddleOCR
- **WHEN** the user selects PaddleOCR in an OCR node's provider setting
- **THEN** that node uses PaddleOCR on its next workflow run
- **AND** the selected provider is saved with the workflow

#### Scenario: Configure Tesseract
- **WHEN** the user selects Tesseract in an OCR node's provider setting
- **THEN** that node uses Tesseract on its next workflow run
- **AND** the selected provider is saved with the workflow

#### Scenario: Load a workflow without provider setting
- **WHEN** the Workbench loads a saved or imported OCR node without a provider setting
- **THEN** it treats the node as configured for Tesseract

#### Scenario: Keep node settings presentation-only
- **WHEN** the user changes the OCR provider setting
- **THEN** the node UI updates workflow state
- **AND** provider initialization and recognition remain in the OCR middleware

### Requirement: Persist OCR provider attribution
The project database SHALL record the provider and available model or engine version for each OCR result.

#### Scenario: Save OCR result attribution
- **WHEN** an OCR provider returns text or a successful no-text result
- **THEN** the project database stores its provider and available model or engine version with the result
- **AND** the result remains associated with its image, workflow run, and OCR node

#### Scenario: Review provider comparison results
- **WHEN** the user opens a Text output node with results from multiple OCR providers
- **THEN** each result entry displays which provider produced it and its available model or engine version

#### Scenario: Migrate existing OCR results
- **WHEN** the app opens a supported project database containing OCR results written before provider attribution was added
- **THEN** it migrates the database without losing existing OCR text, confidence, word evidence, image references, or run metadata
- **AND** treats legacy results as Tesseract results because Tesseract was the only supported provider
