## ADDED Requirements

### Requirement: Offer forensic analysis transforms and structured evidence output
The Workbench SHALL offer Image Provenance and Visual Text & Identifiers transform nodes, plus an inspection-only Evidence Report output node for structured transform results.

#### Scenario: Show forensic tools in the catalog
- **WHEN** a user opens the Workbench node catalog
- **THEN** Image Provenance and Visual Text & Identifiers appear under Transforms
- **AND** Evidence Report appears under Outputs

#### Scenario: Connect image provenance analysis
- **WHEN** a user connects an Image output to an Image Provenance input
- **THEN** the typed connection is accepted and Image Provenance can connect its evidence output to Evidence Report

#### Scenario: Connect visual text analysis
- **WHEN** a user connects an Image output to a Visual Text & Identifiers input
- **THEN** the typed connection is accepted and Visual Text & Identifiers can connect its evidence output to Evidence Report

#### Scenario: Configure visual identifier detection
- **WHEN** a user selects Visual Text & Identifiers
- **THEN** the inspector exposes OCR language, enabled candidate families, and an optional explicit license-plate region profile
- **AND** it does not select a plate profile by default

#### Scenario: Inspect saved evidence
- **WHEN** a user selects Evidence Report after a workflow run
- **THEN** the inspector displays saved findings/candidates with source image name and ID, source coordinates or metadata fields, confidence when available, tool version, and run time
- **AND** it can copy a selected value without rerunning the transform

#### Scenario: Keep the node UI presentation-only
- **WHEN** forensic transform nodes render or receive actions
- **THEN** they receive state/results through the node interface and do not own image parsing, OCR rules, workflow execution, or persistence logic

### Requirement: Persist forensic transform results independently
The project database SHALL persist Image Provenance and Visual Text & Identifiers results in separate append-only tool-specific tables associated with source images, workflow runs, and node instances.

#### Scenario: Store provenance result
- **WHEN** Image Provenance completes for a source image
- **THEN** the app stores normalized facts, indicators, status, tool/schema version, start/finish times, workflow-run ID, node ID, and stable image reference in the provenance results table

#### Scenario: Store identifier result
- **WHEN** Visual Text & Identifiers completes for a source image
- **THEN** the app stores recognized text/word evidence, bounding boxes, enabled rules/profile, candidate matches, status, tool/schema version, start/finish times, workflow-run ID, node ID, and stable image reference in the identifier results table

#### Scenario: Preserve successful empty analysis
- **WHEN** an analysis succeeds with no indicators or no recognized text/candidates
- **THEN** the app appends a successful row with empty collections so the run is distinguishable from an unrun transform

#### Scenario: Preserve earlier results on failure
- **WHEN** a later analysis run fails
- **THEN** the app records the failed step and error while keeping prior successful rows and completed workflow steps available

#### Scenario: Migrate existing projects
- **WHEN** the app opens a project database without forensic transform tables
- **THEN** it idempotently adds both result tables while preserving existing images, metadata, workflows, OCR results, and run history

### Requirement: Execute forensic handlers through the workflow runner
The Workbench SHALL execute each forensic transform through its independently tested package handler in dependency order and report progress and errors through workflow state.

#### Scenario: Run a connected forensic path
- **WHEN** the user runs a valid Image → Image Provenance or Image → Visual Text & Identifiers → Evidence Report path
- **THEN** the runner passes local image data and configured node settings to the matching package handler, persists that step's result before advancing, and updates the active node/progress state

#### Scenario: Fail a forensic step
- **WHEN** input parsing, OCR, analysis, or persistence fails for a forensic transform
- **THEN** the runner marks that node failed with an actionable error, retains completed step results, records the run failure, and allows retry

#### Scenario: Inspect output without execution
- **WHEN** a user selects or copies a value in Evidence Report
- **THEN** the app reads saved result rows and does not invoke a transform handler
