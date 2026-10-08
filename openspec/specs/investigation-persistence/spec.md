# investigation-persistence Specification

## Purpose
Persist an investigation (uploaded images + extracted metadata) into a portable
`.investigation` archive the user chooses via a file dialog, and restore that
archive into a live session on demand. All archive/domain logic lives in a
dedicated package with dependency-inverted ports so it is testable without the
desktop app.

## Requirements

### Requirement: Save action in the app
The app header SHALL provide a save action that is enabled whenever at least one
image is loaded and disabled otherwise. Activating it opens a save dialog
defaulting to a timestamped `.investigation` filename, and on confirmation
writes the archive to the chosen location and records it as a recent
investigation. Cancelling the dialog is a silent no-op that changes nothing.

#### Scenario: Save a loaded session
- **WHEN** images are loaded and the user activates the save action and confirms a path
- **THEN** a `.investigation` file is written at the chosen path and the action reports success

#### Scenario: Save with no images
- **WHEN** no images are loaded
- **THEN** the save action is disabled and cannot be activated

#### Scenario: Dialog cancelled
- **WHEN** the user cancels the save dialog
- **THEN** no file is written and the app state is unchanged

### Requirement: Archive format (`.investigation`)
An `.investigation` file SHALL be a zip container with a manifest
(`investigation.json`), a SQLite metadata database (`investigation.db`), and an
`images/` directory. The manifest SHALL carry the format version, investigation
name, timestamps, image count, and the producing app version. The database SHALL
hold the investigation meta and one row per image with its original filename,
archive path, and complete extracted metadata as JSON.

#### Scenario: Container layout
- **WHEN** an archive is built
- **THEN** it contains `investigation.json`, `investigation.db`, and `images/…` —
  every uploaded image preserved bit-identically, with deduplicated filenames
  inside the archive

### Requirement: Format version compatibility
The manifest `formatVersion` SHALL be the compatibility gate: a reader MUST
reject archives whose `formatVersion` it does not support, with an error that
names the file as unsupported rather than unreadable.

#### Scenario: Format round-trip
- **WHEN** an archive is built from a session and then opened
- **THEN** the image bytes in `images/` are byte-identical to the originals and the metadata read back equals the metadata written

#### Scenario: Unsupported format version
- **WHEN** an archive with an unknown `formatVersion` is opened
- **THEN** the reader fails with an explicit unsupported-version error and no session state is created

### Requirement: Metadata database
The SQLite database SHALL record, per investigation: the investigation meta
(name, timestamps, app version, format version) and per image: original file
name, archive path, extracted metadata as JSON, and the time it was added. The
metadata stored SHALL be sufficient to restore the session without re-running
EXIF extraction.

#### Scenario: Metadata survives save/load
- **WHEN** images with GPS, camera, and timestamp metadata are saved and reopened
- **THEN** those metadata fields are available in the restored session without re-extraction

### Requirement: Restored session state
Opening an archive SHALL restore the session to its saved state: every archived
image is present in the gallery with its metadata attached and a usable image
URL, and no EXIF re-processing is triggered for restored images. Derived views
(map, list, analysis) operate on the restored state unchanged.

The restore SHALL also recreate the state needed to continue working where the
user left off: the active view mode, the map route-overlay toggle, previously
imported KML overlay data (re-parsed from the stored raw KML), previously
imported CSV point entries (restored as point entries without image bytes), and
the selected investigation analysis tool.

#### Scenario: Resume after restart
- **WHEN** the user saves, closes the app, and later opens the same archive
- **THEN** the app shows the same set of images with their metadata, and map/list/analysis views work over them

#### Scenario: No duplicate processing
- **WHEN** an archive is opened
- **THEN** restored images are not re-run through EXIF extraction

#### Scenario: Map state restored
- **WHEN** a session saved with route overlay enabled and an imported KML is reopened
- **THEN** the map shows the route overlay enabled and the KML overlay re-parsed and rendered

#### Scenario: Investigation tool restored
- **WHEN** a session saved while in the investigation view with an analysis tool selected is reopened
- **THEN** the app opens in the investigation view with that tool selected

#### Scenario: Imported points restored
- **WHEN** a session with imported CSV point entries is reopened
- **THEN** the point entries appear on the map as before, without image bytes

### Requirement: Open action and error handling
The app SHALL provide an open action (from the splash screen) using a file
dialog filtered to `.investigation` files. Unreadable files, files that are not
valid `.investigation` archives, and unsupported format versions SHALL surface a
clear error naming the problem and leave the current session unchanged.

#### Scenario: Foreign file rejected
- **WHEN** the user opens a file that is not a valid `.investigation` archive
- **THEN** an error naming the problem is surfaced and the running session (or splash screen) is unchanged

#### Scenario: Open failure leaves state intact
- **WHEN** opening fails for any reason
- **THEN** the previously loaded images and metadata remain exactly as they were

### Requirement: Logic lives in the archive package
All archive-format, database-schema, writer, and reader logic SHALL live in a
dedicated package (not the desktop app) with the SQL execution engine and zip
codec injected as ports. The desktop app SHALL only bind the ports to concrete
runtimes and map archive records to its session model. The package MUST be
testable without the desktop app or Tauri.

#### Scenario: Package tests run standalone
- **WHEN** the package's test suite is run
- **THEN** it exercises the full archive build/read round-trip without importing desktop app code
