# kml-import Delta

## ADDED Requirements

### Requirement: KML parsing accepts namespace-prefixed documents

The system SHALL parse KML documents that use the `kml:` namespace prefix on
elements (e.g. `<kml:Placemark>`) identically to unprefixed documents.

#### Scenario: Prefixed KML yields all placemarks

- **WHEN** a KML document whose elements use the `kml:` prefix is imported
- **THEN** the parsed result contains one feature per placemark in the document

#### Scenario: Unprefixed KML yields all placemarks

- **WHEN** a KML document with unprefixed elements and the standard KML
  namespace declaration is imported
- **THEN** the parsed result contains one feature per placemark

### Requirement: KML parsing supports geometry types and metadata

The system SHALL parse Point, LineString, and Polygon geometries from KML, and
SHALL preserve placemark `<name>` and extended data as feature properties so
they are available for map popups.

#### Scenario: Mixed geometry document

- **WHEN** a KML document contains a Placemark with a LineString and a
  Placemark with a Point
- **THEN** the parsed result contains both features with their respective
  geometry types

### Requirement: KML parse failures are reported, not swallowed

The system SHALL reject the import with a descriptive error when a KML file
cannot be parsed (malformed XML or no KML content), instead of resolving with
an empty result.

#### Scenario: Malformed XML

- **WHEN** a file selected as KML contains XML that fails to parse
- **THEN** the import fails with an error message indicating the KML file
  could not be parsed

#### Scenario: Valid XML with no KML content

- **WHEN** a file selected as KML is well-formed XML but contains no KML
  elements
- **THEN** the import fails with an error message indicating no KML content
  was found

### Requirement: KML validation does not require an XML declaration

The system SHALL NOT reject a KML file solely because it lacks an `<?xml ...?>`
declaration.

#### Scenario: KML without XML declaration

- **WHEN** a file without an XML declaration but with valid KML content is
  imported
- **THEN** the import succeeds and the parsed layer is returned

### Requirement: Imported KML renders without default markers

The system SHALL produce a map-ready layer from the parsed KML features that
does not create default Leaflet marker icons for point features; rendering
style is owned by the map layer component.

#### Scenario: Point placemarks render via the map layer component

- **WHEN** an imported KML layer is handed to the map
- **THEN** point features are rendered by the map layer component's GeoJSON
  rendering and no default Leaflet marker icons are created