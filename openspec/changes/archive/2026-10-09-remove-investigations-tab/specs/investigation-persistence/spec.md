# Spec Delta

## MODIFIED Requirements

### Requirement: Restored session state
Opening a project SHALL restore its images, metadata, and supported session state: the active Map, List, or Workbench view; the map route-overlay toggle; previously imported KML overlay data (re-parsed from stored raw KML); and previously imported CSV point entries (restored as point entries without image bytes). The restore SHALL ignore obsolete Investigation-only tool state. A project saved with the removed `investigation` view mode SHALL open in Workbench.

#### Scenario: Resume after restart
- **WHEN** a user saves, closes the app, and later opens the same project
- **THEN** the app restores its images and metadata, opens its supported saved view, and Map, List, and Workbench operate on the restored data

#### Scenario: No duplicate processing
- **WHEN** a project is opened
- **THEN** restored images are not re-run through EXIF extraction

#### Scenario: Map state restored
- **WHEN** a session saved with route overlay enabled and an imported KML is reopened
- **THEN** the map shows the route overlay enabled and the KML overlay re-parsed and rendered

#### Scenario: Investigation tool restored
- **WHEN** a project saved with `viewMode` set to `investigation` is opened
- **THEN** it opens in Workbench and ignores any previously saved Investigation tool selection

#### Scenario: Imported points restored
- **WHEN** a session with imported CSV point entries is reopened
- **THEN** the point entries appear on the map as before, without image bytes
