# Capability: application-core

## Requirements

### Requirement: Desktop domain import boundary
The desktop application SHALL NOT import `investigation-archive`, `workbench-workflow`, any `*-middleware` package, or `exifreader` directly. Domain access SHALL go through `exif-hound-core` or `exif-hound-core/*` subpaths.

#### Scenario: Lint and scan enforcement
- **WHEN** a developer adds `import { ProjectStore } from 'investigation-archive'` under `apps/exif-hound-desktop/src`
- **THEN** ESLint reports a restricted import violation
- **AND** `npm run scan:domain-imports` exits non-zero

### Requirement: Core bootstrap
The desktop app SHALL initialize domain functionality via `createDesktopCore()` from `exif-hound-core/desktop` before rendering session-dependent UI.

#### Scenario: Single core instance
- **WHEN** the app boots in Tauri or test harness
- **THEN** one `ExifHoundCore` instance is available to controllers via context or `getCore()`

### Requirement: Controller boundary
View-level orchestration (project open, workbench run, evidence load) SHALL reside in desktop controller modules under `src/controllers/`, not in presentational components.

#### Scenario: Workbench run
- **WHEN** the user triggers a workflow run
- **THEN** the React component delegates to `WorkbenchController` (or hook)
- **AND** the controller invokes `core.workbench` services only

### Requirement: Business logic location
Evidence indexing, workbench run planning, project session mapping, updater scheduling, import/export parsing, and geocoding SHALL live under `packages/exif-hound-core/src`, not under `apps/exif-hound-desktop/src/services`.

#### Scenario: Evidence hub load
- **WHEN** evidence is loaded for a project
- **THEN** implementation code executes from `exif-hound-core` evidence module
- **AND** desktop `EvidenceController` only maps results to view props
