## Purpose

Provides a project-scoped visual workflow editor where users connect image inputs, analysis transforms, and outputs on an open canvas.

## ADDED Requirements

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
