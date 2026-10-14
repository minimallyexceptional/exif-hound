# Spec delta: evidence-hub

## ADDED Requirements

### Requirement: Place names on GPS evidence
When reverse geocoding is enabled in Settings, compiling GPS evidence SHALL look up missing place names with the same Nominatim helper used at upload.

#### Scenario: Place names enabled and GPS image has no label
- **WHEN** the user opens Evidence with reverse geocoding enabled and a GPS-tagged image has no formatted place name
- **THEN** the GPS row Place column shows the looked-up name and the session image EXIF location is updated

#### Scenario: Place names disabled
- **WHEN** reverse geocoding is disabled
- **THEN** compiling GPS evidence SHALL NOT send coordinates to Nominatim

#### Scenario: Image already has a place name
- **WHEN** an image already has a formatted place name
- **THEN** compiling GPS evidence SHALL reuse it and SHALL NOT look it up again
