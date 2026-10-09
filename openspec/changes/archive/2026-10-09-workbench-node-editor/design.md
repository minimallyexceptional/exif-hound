# Design

## Context

See `proposal.md` for motivation and scope. The desktop app currently renders Workbench as a single component with an image stage, a horizontal `ImageGallery`, and an OCR row. The shared gallery's horizontal layout was added for that screen. `ImageData.projectImageId` provides a stable project image ID, `ProjectStore` stores OCR results by image ID, and the existing `OcrMiddleware` supports language selection and progress callbacks. Project database schema v3 is automatically forward-migrated during project open.

The current release matrix is defined by `.github/workflows/release.yml`: Linux x86_64 and ARM64, macOS Apple Silicon (aarch64), and Windows x86_64. Keep this feature compatible with every target in that matrix and avoid adding target-specific behavior that would prevent extending support to other architectures.

## Goals / Non-Goals

**Goals:**
- Build a desktop-first node editor with an Input catalog on the left, an open workflow canvas in the center, and a contextual inspector on the right.
- Persist multiple named workflows per project and execute each connected pipeline in dependency order with the existing OCR implementation.
- Save reusable workflow templates in a machine-wide JSON library that works across Linux, macOS, and Windows.
- Append each completed tool result to its dedicated project database table and retain workflow run history.
- Keep graph serialization independent from canvas runtime objects, blob URLs, and React component state.
- Keep reusable node components presentation-focused and all graph/tool behavior independently testable outside the UI, developed test-first.

**Non-Goals:**
- Change the public OCR middleware API or its Tesseract worker lifecycle.
- Implement reverse image search, similarity matching, or any transform beyond OCR in this first node catalog.
- Add general-purpose workflow scripting, branching semantics, or custom user-defined node types.

## Decisions

### Keep canvas components dumb and processing logic outside the UI

Put the platform-neutral workflow model, typed node/edge contracts, graph validation, serialization, and dependency-ordered runner in a dedicated shared package such as `packages/workbench-workflow`. Keep this package free of React, Tauri, DOM, and filesystem dependencies. It accepts a graph and injected node handlers/persistence adapters, then emits typed run-state, progress, and result events. UI components render supplied node state and call supplied actions; they do not validate graphs, serialize files, access the database, invoke OCR, or run processors.

Each node type's behavior belongs in a testable package-level handler. OCR delegates recognition to the existing `packages/ocr-middleware`; the workflow package adapts its typed interface to runner inputs and outputs. Image selection resolution and Text result query/format behavior belong in non-UI adapters/packages, with the desktop app providing project-specific image/database adapters. Reusable canvas nodes and settings/inspector views consume typed state and actions without owning execution behavior.

Develop behavior test-first using red/green/refactor: write failing unit tests for graph validation and serialization, then runner ordering, progress, failure handling, and node input/output contracts before implementing those behaviors. Add focused handler tests for each tool package, including OCR empty results and failures, and adapter tests for durable result writes. Keep tests next to the packages that own the logic. Desktop tests cover UI wiring, state rendering, and user interactions. Package tests should use fake handlers and persistence adapters so they do not require Tauri, a real home directory, OCR workers, or a live database.

The dependency direction is desktop UI → workflow model/runner → injected node handlers and persistence interfaces. Tool packages must not import Workbench React components. The workflow core must not import the desktop app, Tauri APIs, or the project database implementation. Platform-specific filesystem and database operations stay behind desktop adapters. Keep the existing OCR middleware API and implementation unchanged.

### Use `@xyflow/react` for the canvas

Use the current React Flow package, `@xyflow/react`, with controlled nodes and edges, custom node renderers, and explicit handle IDs for image and text ports. The node catalog creates nodes through desktop drag-and-drop; nodes use the library's coordinate conversion when dropped onto the canvas. A single connection validator checks source/target direction and data type so only Image → OCR and OCR → Text links are accepted. The official drag-and-drop and handle APIs support this composition: [React Flow drag and drop](https://reactflow.dev/examples/interaction/drag-and-drop), [handle reference](https://reactflow.dev/api-reference/components/handle).

Import the package's base stylesheet after Tailwind in `index.css`, as required by its Tailwind 4 setup. Override its canvas, edge, focus, handle, and selection variables with the app's theme tokens so dark and light modes stay consistent. Keep controls and graph state inside a focused Workbench component; pass project images and persistence/execution callbacks at the app boundary.

### Persist named workflows and run history in the project database

Add a `workbench_workflows` table with one row per named workflow, including an ID, project ID, name, graph JSON, and update timestamp. Serialize node IDs, node types, positions, user settings (including an Image node's stable project image ID and OCR language), and edges. Do not serialize selected UI state, worker state, `File` objects, object URLs, or functions. Add `workflow_runs` for each execution, with workflow ID, status, start and finish timestamps, progress counters/current node, and error details when applicable. The Image node resolves its preview from the current project's loaded image records.

Expose `ProjectStore` read/write operations for workflows, run history, and tool results. Save graph edits with a short debounce and flush before workflow switching or project switching. A project without a saved workflow starts with an empty default workflow and the add-node prompt. Run history is durable; progress updates can update the active run row as execution advances.

### Store reusable workflow templates as portable JSON

Use a second Workbench tab to list machine-wide saved workflow templates. On Save Workflow, prompt for a name, validate it as a filename component, and write a versioned JSON document under `.exif-hound/workflows` in the user's home directory. Resolve the home directory through Tauri's platform path API and build paths with native path operations; do not concatenate slash-delimited paths or assume `~` expansion. Use the same relative directory convention on Linux, macOS, and Windows. Ensure filesystem permissions/capabilities allow access only to this directory and create it when needed. Write and sync a temporary file before atomically publishing it without replacing an existing name; remove temporary files on failure.

The JSON format contains a format version, workflow name, serializable node definitions (stable IDs, types, positions, settings), and edges/connections. It excludes project IDs, run history, tool results, image file paths, image IDs, object URLs, and runtime state. Keep values in standard JSON types and avoid architecture-dependent numbers, binary blobs, path separators, or native handles. Image node settings in a reusable template reset to no selected project image on import. Double-clicking a listed workflow validates its version and shape, creates a project-scoped copy in the active project database, then opens it in the graph. Keep the current workflow intact if parsing or validation fails. The Workflows tab is machine-wide; project workflow graphs and run records remain project-scoped.

Use platform-neutral React/TypeScript and Rust code for workflow persistence. Any required Tauri filesystem/path plugin and Rust crate must support all targets in the current release matrix; do not introduce architecture-specific binaries or unsupported native modules for graph editing, JSON serialization, or OCR orchestration. Existing Tesseract.js worker and language assets must continue to be bundled/resolved through the existing OCR middleware contract. SQLite migrations and serialized graph data must not depend on host endianness, pointer width, or filesystem path syntax.

### Cross-platform and architecture compatibility

Use `PathBuf`/native path APIs in Rust (or the Tauri path API at the app boundary) and resolve the home directory at runtime. The `.exif-hound/workflows` directory is a relative convention beneath that resolved home directory; never assume Unix `~` expansion, `/` separators, a drive letter, case sensitivity, or a fixed home path. Convert paths only at filesystem API boundaries. Validate a workflow name as one safe filename component on all supported filesystems, including reserved characters/names and case-insensitive collisions. Keep file encoding UTF-8, normalize workflow names consistently for duplicate detection, and handle Unicode names safely.

The workflow JSON schema and project database schema are architecture-neutral. Keep migrations transactional and idempotent, and do not store host-specific absolute paths in reusable templates. Verify the feature on every release target where CI/build runners are available: compile/package the app, exercise directory resolution and save/list/open behavior, and open the same fixture JSON across architecture variants. Ensure frontend node/canvas dependencies build for the supported webview toolchains. If a required capability is unavailable on a target, fail with a user-visible storage or capability error while leaving saved project data intact.

### Migrate schema v3 projects to v4

Add workflow and run-history tables and update the OCR results schema in the existing idempotent migrations, advancing `SCHEMA_FORMAT_VERSION` to 4. Validation must accept supported schema versions 2, 3, and 4 before migration. Opening v2 or v3 projects runs migrations before the store is exposed and persists the upgraded database. Migrate each existing v3 OCR row into the new append-only OCR result shape, preserving its image ID, text, confidence, and timestamp; legacy rows have no workflow/run/node association. Do not add new tables to pre-migration required-table validation, or older projects will be rejected before upgrade.

### Execute the active workflow as a pipeline

Place Run Workflow in the page's top-right header. Before starting, validate the active graph's required connections and selected images. Create a workflow-run record, then execute connected paths in dependency order. Show overall step progress beside the run action and visibly highlight the node currently processing. Persist each tool result immediately after that tool finishes, before advancing. Reuse one `OcrMiddleware` instance and its progress callback for OCR nodes. Append an OCR result row for every completed OCR step, including empty/whitespace results (with a no-text result status); include source image name and ID, extracted text, confidence when available, workflow/node/run IDs, and processing timestamp. Do not overwrite previous runs' results. Do not permit overlapping runs of the same workflow. A failure records the failed run and node while keeping earlier completed result rows and the graph intact.

For multiple connected paths, process ready paths in a predictable sequence through the middleware's existing serialized queue and associate results with their originating nodes and workflow run. Output nodes are read-only views: selecting a Text node queries saved result rows for its connected OCR node; it never runs the tool. Display each result's source image identity, extracted text, confidence, and time, with per-entry copy controls. Keep the latest run's status/timing visible while preserving access to prior results.

### Keep the shared image gallery vertical-only

Remove the horizontal orientation prop and horizontal sizing/scrolling branches from `ImageGallery`; Map View continues to use its vertical layout. Workbench no longer mounts the gallery and selects images in each Image node's settings.

## Risks / Trade-offs

- **Schema v4 cannot be opened by older app versions →** document the forward-only migration and preserve all existing project data; rollback requires restoring the project's `data/data.db` from a pre-upgrade copy.
- **Persisted image IDs can refer to missing records →** resolve IDs against the active project before rendering or running; show a missing-image state and allow the user to choose another image.
- **React Flow's base CSS can override application theme styles →** import it in the global stylesheet in the documented order, then explicitly map its variables to app tokens and verify both themes.
- **Home paths, filenames, and target capabilities vary by OS/architecture →** use native path APIs, validate names consistently, keep data formats architecture-neutral, and verify the current release target matrix.
- **A malformed or partially written template could disrupt the graph →** version and validate JSON before import, write atomically, and preserve the active project workflow on failure.
- **Large graphs can make autosave noisy →** debounce writes, flush on cleanup, and test that rapid position changes settle to the latest serialized graph.
- **Tesseract can report status-only progress events →** retain an indeterminate visual state when numeric progress is not meaningful and only mark completion after persistence succeeds.

## Migration Plan

1. Add schema v4 named workflow, run-history, and append-only OCR result storage; migrate existing v2/v3 projects while retaining images, metadata, session state, and legacy OCR rows.
2. Build the canvas, node catalog, node inspectors, typed connections, and per-project graph restore/save behavior.
3. Add the machine-wide Workflows tab and portable versioned JSON save/list/open flow using platform home-directory and native path APIs.
4. Implement the graph model, validation, serialization, runner, and node handlers test-first using red/green/refactor. Then wire ordered execution, overall progress, active-node highlighting, per-step durable result writes, and output-node inspection into the existing OCR middleware; remove the old Workbench run row and full-screen OCR results route.
5. Restore `ImageGallery` to vertical-only mode and run focused unit/E2E, typecheck, lint, production builds for available release targets, and OpenSpec validation.

Rollback after a v4 migration requires restoring a pre-upgrade project database backup; no automatic downgrade is planned.
