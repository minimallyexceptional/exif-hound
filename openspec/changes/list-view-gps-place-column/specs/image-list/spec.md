# Spec delta: image-list

## ADDED Requirements

### Requirement: GPS columns visible by default
The List view spreadsheet SHALL show the GPS Data group (Place, Latitude, Longitude, Altitude) on a default mount and after Reset Columns.

#### Scenario: Default list columns include GPS
- **WHEN** the user opens List view without changing column visibility
- **THEN** the spreadsheet headers include Place, Latitude, Longitude, and Altitude

#### Scenario: Reset restores GPS columns
- **WHEN** the user turns GPS Data off and then chooses Reset Columns
- **THEN** Place, Latitude, Longitude, and Altitude headers are visible again

### Requirement: Place column shows reverse-geocoded name
The Place column SHALL show `exif.location.formatted` when that string is non-empty after trim, and "—" otherwise.

#### Scenario: Formatted place name present
- **WHEN** an image has `exif.location.formatted` set to a non-empty string
- **THEN** the Place cell shows that string

#### Scenario: Missing or empty place name
- **WHEN** an image has no location, empty or whitespace-only `formatted`, a loading location, or a location error
- **THEN** the Place cell shows "—"
