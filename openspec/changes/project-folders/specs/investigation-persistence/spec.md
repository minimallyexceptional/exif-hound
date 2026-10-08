# investigation-persistence — Specification (delta)

## REMOVED Requirements

### Requirement: Save action in the app
**Reason**: Replaced by live write-through persistence to the project folder
(see `project-store`) — there is no save step to expose as an action.

**Migration**: The header save button is removed. Data is durable as the user
works; no user action replaces it.

### Requirement: Archive format (`.investigation`)
**Reason**: The proprietary zip container is replaced by the project folder
format (`<project>/images/` + `<project>/data/data.db`).

**Migration**: Previously exported `.investigation` files are superseded;
project folders are the only supported persistence format going forward.

### Requirement: Format version compatibility
**Reason**: Applies only to the removed zip archive format. The project store
validates `data.db` schema compatibility instead (see `project-store`).

**Migration**: None — the zip format no longer exists.

### Requirement: Metadata database
**Reason**: Superseded by the `project-store` requirements: images, EXIF
results, imports, and session state are persisted to `<project>/data/data.db`
continuously rather than bundled into an archive on save.

**Migration**: Covered by `project-store` requirements (EXIF persisted to
data.db; imports written to the data folder).

### Requirement: Restored session state
**Reason**: Superseded by `project-store`'s "Views repopulated from the
database" requirement, which restores images, metadata, view mode, route
toggle, investigation tool, and imports from the project folder.

**Migration**: Covered by `project-store` requirements.

### Requirement: Open action and error handling
**Reason**: The zip open flow is replaced by project folder opening with
validation (see `project-store`'s "Open existing project validates the
folder").

**Migration**: The splash "Open investigation…" action becomes "Open existing
project" with folder validation; errors still leave app state unchanged.
