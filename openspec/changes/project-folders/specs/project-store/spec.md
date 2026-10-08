# project-store — Specification (delta)

## ADDED Requirements

### Requirement: Project folder structure
A project SHALL be a named folder inside a user-chosen parent folder with this
structure: `<parent>/<project-name>/images/` (uploaded images on disk) and
`<parent>/<project-name>/data/data.db` (SQLite database). The `data.db` file
SHALL be created before any other project content is written.

#### Scenario: Creating a new project
- **WHEN** the user picks a parent folder and supplies a project name
- **THEN** the folder `<parent>/<name>/` is created with `data/data.db` (valid, migratable schema) and an `images/` directory before any other content

#### Scenario: Name collision
- **WHEN** a folder with the same name already exists in the parent
- **THEN** creation fails with a clear error and nothing is created or overwritten

### Requirement: Images written to the project on upload
When a project is open, every uploaded image SHALL be written to the project's
`images/` directory on disk (original bytes preserved). Filename collisions in
`images/` SHALL be deduplicated. The image's metadata SHALL be written to
`data.db` as part of the same logical action. Images loaded outside a project
(from the no-project state) keep current behavior.

#### Scenario: Upload writes through
- **WHEN** the user uploads images while a project is open
- **THEN** each image file appears in `images/` and each image's extracted EXIF is persisted to `data.db`

#### Scenario: Duplicate filename
- **WHEN** an uploaded image's name already exists in `images/`
- **THEN** the new file is stored under a deduplicated name and both remain

### Requirement: EXIF results persisted to data.db
EXIF extraction results (the output of the exif middleware) SHALL be persisted
to the project's `data.db` — the extracted metadata fields per image, plus
location data when available. The database record, not in-memory state, is the
durable source for restoring the session.

#### Scenario: EXIF survives restart
- **WHEN** images with GPS and camera metadata are uploaded and the app is closed and reopened
- **THEN** the metadata is restored from `data.db` without re-extraction

### Requirement: Imports written to the project data folder
Imported KML and CSV files SHALL be written to the project's `data/` directory.
Importing a second KML or CSV file SHALL replace the previously stored one (one
current import per type). The import is re-parsed from disk when the project is
reopened.

#### Scenario: KML import writes through
- **WHEN** a KML file is imported while a project is open
- **THEN** the raw KML file is stored in `data/` and re-parsed on next open

#### Scenario: Second import replaces the first
- **WHEN** a second KML (or CSV) file is imported
- **THEN** it replaces the previously stored file of that type

### Requirement: Investigation and session state persisted to data.db
The following state SHALL be written to `data.db` as the user works, not held
only in memory: current view mode, map route toggle, the active investigation
analysis tool, and the list of imported data files. Investigation insight
data is computed from persisted image metadata on open.

#### Scenario: State survives restart
- **WHEN** the user is in the investigation view with a tool selected, closes, and reopens the project
- **THEN** the app restores to the investigation view with that tool selected

### Requirement: Views repopulated from the database
When a project is opened, the app SHALL rebuild all views (list, map,
investigation) from `data.db` and the `images/` directory — image entries are
reconstructed from their db records and on-disk files with no EXIF
re-extraction. The list view SHALL show exactly the images recorded in the db.

#### Scenario: List view after reopen
- **WHEN** a project is opened
- **THEN** the list view shows the images recorded in the database, with metadata attached

### Requirement: Open existing project validates the folder
The splash screen SHALL provide an "Open existing project" action using a
folder picker. The selected folder SHALL be validated before opening: it must
contain `data/data.db` (a database with the expected schema) and an `images/`
directory. Invalid selections fail with a clear error naming the problem;
the app state is unchanged on failure.

#### Scenario: Valid project opens
- **WHEN** the user selects a folder containing `data/data.db` and `images/`
- **THEN** the app opens the project and repopulates views from the database

#### Scenario: Invalid folder rejected
- **WHEN** the selected folder lacks `data/data.db` or `images/`, or the db does not match the expected schema
- **THEN** an error naming the problem is shown and nothing is loaded

### Requirement: Logic lives in the project store package
Project folder creation, validation, `data.db` schema/migrations, and all
read/write operations SHALL live in an OOP package (testable without the
desktop app or Tauri), with the SQL engine injected as a port. The desktop app
only binds the port and maps records to its session model.

#### Scenario: Package tests run standalone
- **WHEN** the package's test suite runs
- **THEN** project creation, write-through operations, and open/validation are exercised without importing desktop app code

### Requirement: Recent projects are project folders
The splash recent list SHALL track opened project folder paths (name +
last-opened time, capped at 10, most recent first). Activating an entry
validates and opens that project folder; a missing/invalid folder surfaces the
open error.

#### Scenario: Recent entry resumes project
- **WHEN** the user activates a recent project entry
- **THEN** the project folder is validated and opened with views repopulated
