## MODIFIED Requirements

### Requirement: Run a connected workflow explicitly
The Workbench SHALL provide a Run Workflow action at the top right that executes the active workflow in dependency order, shows overall progress beside the action, and highlights the node currently processing.

#### Scenario: Run a connected path
- **WHEN** the user starts a workflow containing a connected Image, OCR, and Text path
- **THEN** the Workbench runs the path in connection order, updates overall progress beside Run Workflow, and highlights the active node
- **AND** a success toast is shown when the run completes

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
- **AND** copy success or clipboard failure is announced with a toast

#### Scenario: Record workflow run history
- **WHEN** a workflow run starts, progresses, completes, or fails
- **THEN** the project database records its status and start and finish times, and exposes the latest run details in the workflow UI

#### Scenario: Run workflow failure
- **WHEN** a transform fails during execution
- **THEN** the Workbench retains the graph and completed tool results, identifies the failed node, records the failed run, and allows the user to retry
- **AND** an error toast is shown
- **AND** the Workbench does not show a persistent error banner
