# workbench-workflow Specification

## Purpose
Provides a project-scoped visual workflow editor where users connect image inputs, analysis transforms, and outputs on an open canvas.

## Requirements

### Requirement: Keep node rendering separate from workflow logic
The Workbench SHALL use reusable node presentation components that receive node state and actions through a defined interface; graph validation, serialization, scheduling, node-specific behavior, and output data access SHALL live outside the UI in independently testable packages.

#### Scenario: Render a node from workflow state
- **WHEN** the canvas renders a workflow node
- **THEN** its reusable UI component displays the supplied state and emits user actions without owning persistence, graph validation, or processing behavior

#### Scenario: Execute a node through its logic package
- **WHEN** the workflow runner processes a node
- **THEN** it invokes that node type's package-level implementation through a typed input/output contract and reports progress and results to the UI as state updates

#### Scenario: Add another tool node
- **WHEN** a new tool is added to the workflow
- **THEN** its processing implementation can be tested and integrated without embedding tool logic in the canvas or inspector components

#### Scenario: Develop workflow logic test-first
- **WHEN** graph, runner, persistence-adapter, or node-handler behavior is implemented
- **THEN** package-level automated tests define its expected inputs, outputs, ordering, progress, and failure behavior before the implementation is completed
- **AND** those tests can run without mounting the desktop UI or requiring native desktop services

### Requirement: Show a categorized workflow node catalog
The Workbench SHALL provide a left-side catalog of nodes grouped by Inputs, Transforms, and Outputs.

#### Scenario: Initial node catalog
- **WHEN** the Workbench is opened
- **THEN** the catalog offers Image under Inputs, OCR under Transforms, and Text under Outputs

#### Scenario: Add a node to the canvas
- **WHEN** the user drags a catalog item onto the canvas
- **THEN** the Workbench creates an instance of that node at the drop location
- **AND** the user can add more than one instance of a node type

#### Scenario: Empty workflow
- **WHEN** a project has no saved workflow nodes
- **THEN** the canvas presents a concise prompt to add an Image node from the catalog

### Requirement: Show image previews on image nodes
An Image node SHALL show a preview of its chosen project image above the node body on the canvas.

#### Scenario: Image selected
- **WHEN** the user chooses an image in an Image node's settings
- **THEN** the node displays a fitted preview of that image above the node body

#### Scenario: No image selected
- **WHEN** an Image node has no selected image
- **THEN** its preview area prompts the user to choose a project image

### Requirement: Connect only compatible workflow nodes
The Workbench SHALL allow left-to-right connections only between compatible node ports.

#### Scenario: Connect an image to OCR
- **WHEN** the user connects the Image node's right-side image output to the OCR node's left-side image input
- **THEN** the Workbench creates a visible connection

#### Scenario: Connect OCR to Text output
- **WHEN** the user connects the OCR node's right-side text output to the Text node's left-side text input
- **THEN** the Workbench creates a visible connection

#### Scenario: Reject an incompatible connection
- **WHEN** the user attempts to connect ports with incompatible data types or directions
- **THEN** the Workbench does not create the connection

### Requirement: Open contextual settings for a selected node
Selecting a workflow node SHALL open its settings or output in a right-side inspector.

#### Scenario: Select a node
- **WHEN** the user selects a node on the canvas
- **THEN** the right-side inspector displays the settings or output for that node

#### Scenario: Select another node
- **WHEN** the user selects a different node
- **THEN** the inspector updates to the newly selected node

#### Scenario: Deselect all nodes
- **WHEN** the user clears the current node selection
- **THEN** the inspector displays a neutral prompt to select a node

### Requirement: Manage named workflows within a project
The Workbench SHALL treat each node graph as a named workflow and save every workflow with the active project.

#### Scenario: Create another workflow
- **WHEN** the user creates a workflow in a project
- **THEN** the Workbench creates a separate graph with its own name and saved state

#### Scenario: Switch workflows
- **WHEN** the user selects another saved workflow
- **THEN** the Workbench restores that workflow's nodes, positions, settings, and connections

### Requirement: Save and open reusable machine-wide workflows
The Workbench SHALL let users save a workflow as a named, versioned JSON file in a machine-wide workflow library and open saved workflows into the active project on every supported desktop platform and architecture.

#### Scenario: Save workflow with a name
- **WHEN** the user chooses Save Workflow
- **THEN** the Workbench prompts for a workflow name and saves the graph description as JSON in the user's `.exif-hound/workflows` directory

#### Scenario: Browse saved workflows
- **WHEN** the user opens the Workflows tab
- **THEN** the Workbench lists valid saved workflow files available on the current machine

#### Scenario: Open a saved workflow
- **WHEN** the user double-clicks a saved workflow in the Workflows tab
- **THEN** the Workbench opens its nodes, positions, settings, and connections in the node graph and saves a project-scoped copy
- **AND** clears project-specific image selections so the user can select images from the active project

#### Scenario: Saved workflow file is missing or invalid
- **WHEN** a listed workflow file has been removed or cannot be parsed as a supported workflow
- **THEN** the Workbench reports that it cannot open that workflow and keeps the current project workflow intact

#### Scenario: Resolve workflow library path across desktop platforms
- **WHEN** the Workbench reads or writes the machine-wide workflow library on a supported Linux, macOS, or Windows build target
- **THEN** it resolves the user's home directory through the platform-supported app API and constructs `.exif-hound/workflows` using native path operations
- **AND** creates the directory when saving if it does not exist

#### Scenario: Use workflow files across architectures
- **WHEN** a workflow JSON file is saved on one supported processor architecture and opened on another
- **THEN** the graph loads without architecture-specific conversion because the file contains only versioned, platform-neutral workflow data

#### Scenario: Handle unavailable workflow storage
- **WHEN** the home directory cannot be resolved or the workflow directory cannot be read or written
- **THEN** the Workbench reports the storage error clearly and leaves the active project workflow intact

#### Scenario: Save workflow changes
- **WHEN** the user adds, moves, configures, connects, or removes a node
- **THEN** the active workflow is saved to that project's database

#### Scenario: Restore workflow
- **WHEN** the user reopens a project with a saved workflow
- **THEN** the Workbench restores the project's saved workflows and the active workflow's nodes, positions, settings, and connections

#### Scenario: Migrate a project without workflow data
- **WHEN** the app opens a supported project database that predates workflow storage
- **THEN** it adds workflow storage while preserving project images, metadata, session state, and OCR results

### Requirement: Run a connected workflow explicitly
The Workbench SHALL provide a Run Workflow action at the top right that executes the active workflow in dependency order, shows overall progress beside the action, and highlights the node currently processing.

#### Scenario: Run a connected path
- **WHEN** the user starts a workflow containing a connected Image, OCR, and Text path
- **THEN** the Workbench runs the path in connection order, updates overall progress beside Run Workflow, and highlights the active node

#### Scenario: Run an incomplete workflow
- **WHEN** the user starts a workflow without a valid connected Image, OCR, and Text path
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

### Requirement: Keep the workflow editor accessible and theme-aware
The workflow editor SHALL support keyboard interaction, visible focus, and both application themes.

#### Scenario: Keyboard add and select nodes
- **WHEN** the user navigates the node catalog or canvas by keyboard
- **THEN** the user can add, focus, select, and inspect nodes without a pointer

#### Scenario: Light theme
- **WHEN** the application uses the light theme
- **THEN** the catalog, canvas, nodes, connections, and inspector remain legible using application theme tokens

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

### Requirement: Preprocess Image node data before workflow dispatch
The Workbench SHALL invoke image-processing middleware from the Image node handler before that handler completes and before any connected transform receives input. This behavior SHALL remain invisible in the node catalog and shall not introduce preprocessing UI or inspector settings.

#### Scenario: Run a branch from an Image node
- **WHEN** a workflow run executes an Image node connected to any transform
- **THEN** the runner awaits preprocessing before emitting Image-node completion or starting that transform
- **AND** every downstream node receives the shared packet containing original bytes, processed bytes, and preprocessing attribution

#### Scenario: Branches share one Image node
- **WHEN** multiple transforms consume the same Image node during one workflow run
- **THEN** the image is preprocessed once and the same immutable packet is shared across branches

#### Scenario: Processing is unavailable for the source image
- **WHEN** preprocessing fails for an Image node
- **THEN** the node and workflow run fail visibly
- **AND** the runner skips every downstream node on that image path

### Requirement: Pass the correct image representation to each analysis transform
Workbench transform handlers SHALL select source or processed image data by analysis purpose and carry preprocessing attribution into each persisted result.

#### Scenario: Run OCR-enabled transform
- **WHEN** OCR or Visual Text & Identifiers runs
- **THEN** the handler supplies processed image bytes to OCR middleware
- **AND** translates returned word locations through the inverse transform to original-image coordinate space
- **AND** saves the mapped OCR word boxes with the OCR result and preprocessing manifest

#### Scenario: Run image provenance transform
- **WHEN** Image Provenance runs
- **THEN** the handler supplies original image bytes and source metadata to provenance middleware
- **AND** associates the result with the packet's preprocessing manifest without changing its analysis input

#### Scenario: Persist tool result
- **WHEN** an OCR, provenance, or identifier result is appended to the project database
- **THEN** it records preprocessing profile/version and applied-operation manifest for that run
