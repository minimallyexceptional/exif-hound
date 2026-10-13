## MODIFIED Requirements

### Requirement: Connect only compatible workflow nodes
The Workbench SHALL allow left-to-right connections only between compatible node ports.

#### Scenario: Connect an image to OCR
- **WHEN** the user connects the Image node's right-side image output to the OCR node's left-side image input
- **THEN** the Workbench creates a visible connection

#### Scenario: Connect OCR to Text output
- **WHEN** the user connects the OCR node's right-side text output to the Text node's left-side text input
- **THEN** the Workbench creates a visible connection

#### Scenario: Chain transforms on the image bypass
- **WHEN** the user connects a transform's right-side image output to another transform's left-side image input
- **THEN** the Workbench creates a visible connection

#### Scenario: Reject an incompatible connection
- **WHEN** the user attempts to connect ports with incompatible data types or directions
- **THEN** the Workbench does not create the connection
- **AND** connecting a transform data output to another transform is rejected

### Requirement: Run a connected workflow explicitly
The Workbench SHALL provide a Run Workflow action at the top right that executes the active workflow in dependency order, shows overall progress beside the action, and highlights the node currently processing.

#### Scenario: Run a connected path
- **WHEN** the user starts a workflow containing a connected Image, OCR, and Text path
- **THEN** the Workbench runs the path in connection order, updates overall progress beside Run Workflow, and highlights the active node

#### Scenario: Run a chained transform path
- **WHEN** the user starts a workflow where Image feeds OCR, OCR image-out feeds Provenance, OCR text-out feeds Text, and Provenance evidence-out feeds Evidence Report
- **THEN** the runner delivers the prepared image packet to Provenance
- **AND** it persists OCR text and provenance findings separately
- **AND** it does not execute the Image node a second time

#### Scenario: Run an incomplete workflow
- **WHEN** the user starts a workflow without a valid connected Image, transform, and matching output path
- **THEN** the Workbench does not start recognition and identifies the missing connection or image selection

#### Scenario: Run with multiple paths
- **WHEN** the workflow contains multiple valid Image, OCR, and Text paths
- **THEN** the Workbench processes each path in dependency order and associates its output with the connected Text node

#### Scenario: Persist each completed tool result
- **WHEN** a tool node finishes processing during a workflow run
- **THEN** the Workbench writes that tool's result to its dedicated project database table before continuing the pipeline

#### Scenario: Inspect output without running tools
- **WHEN** the user selects or copies a value from an output node
- **THEN** the Workbench displays or copies saved output without starting tool execution

#### Scenario: Record workflow run history
- **WHEN** a workflow run starts, progresses, completes, or fails
- **THEN** the project database records its status and start and finish times, and exposes the latest run details in the workflow UI

#### Scenario: Run workflow failure
- **WHEN** a transform fails during execution
- **THEN** the Workbench retains the graph and completed tool results, identifies the failed node, records the failed run, and allows the user to retry

## ADDED Requirements

### Requirement: Transforms expose an image bypass and a data output
Every analysis transform SHALL accept an image input and SHALL expose an image bypass output plus a typed data output. OCR data is `text`. Provenance and Text & Identifiers data is `evidence`. Canvas handles SHALL be labeled Image and Data.

#### Scenario: Transform handles on the canvas
- **WHEN** the canvas renders an OCR, Image Provenance, or Text & Identifiers node
- **THEN** the node shows one left-side image input and two right-side outputs labeled Image and Data

#### Scenario: Existing graphs remain valid
- **WHEN** a saved workflow already connects a transform data port to Text or Evidence Report and has no image-out edge
- **THEN** the graph remains valid and runnable
- **AND** the unused image bypass handle is available for a later connection
