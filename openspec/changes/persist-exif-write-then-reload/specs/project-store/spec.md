# Spec delta: project-store

## ADDED Requirements

### Requirement: Upload EXIF is reloaded from the database
When an uploaded image is persisted, the session SHALL replace that image's EXIF from the stored `exif_json` value, not from the in-memory extract that was just written. The session image identity (client id, object URL, and File) SHALL be unchanged.

#### Scenario: Session EXIF comes from stored JSON
- **WHEN** an image finishes uploading and is written to the project
- **THEN** the session image's EXIF equals the JSON parsed from that image's `exif_json` row and its `projectImageId` is the inserted row id

#### Scenario: Session identity is preserved
- **WHEN** an image finishes uploading and is written to the project
- **THEN** the session image keeps the same client id, object URL, and File as before the write

### Requirement: addImage returns stored EXIF
`ProjectStore.addImage` SHALL return EXIF parsed from the inserted `exif_json` text, not the input object passed to the method.

#### Scenario: Returned EXIF is a database round-trip
- **WHEN** `addImage` is called with an EXIF object
- **THEN** the returned record's `exif` is not the same object reference as the input and equals `JSON.parse` of the stored `exif_json`
