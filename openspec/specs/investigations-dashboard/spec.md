# investigations-dashboard Specification

## Purpose
Provides the Investigations tab's dataset-insights dashboard: a continuously updated, background-derived summary of the loaded images' EXIF data (locations, devices, timeline of events, software processing, anomalies) that an OSINT investigator can read at a glance, with drill-in access to the existing deep-analysis tools.

## Requirements

### Requirement: Dashboard is the Investigations landing view
When the Investigations tab opens with images loaded, the system SHALL display a dashboard of dataset insights as the main page. The four existing analysis tools (Pattern Analysis, Geolocation Analysis, Timeline Analysis, Software Processing) SHALL remain accessible from the dashboard via drill-in, and users SHALL be able to return to the dashboard from any tool.

#### Scenario: Dashboard shown on tab open
- **WHEN** the Investigations tab is opened with images loaded
- **THEN** the main page shows insight sections rather than the previous tool list

#### Scenario: Drill into an existing tool and back
- **WHEN** the user activates a drill-in entry for an existing analysis tool
- **THEN** that tool renders in the tab as before, with a visible way to return to the dashboard

### Requirement: Insights aggregate in the background
The system SHALL compute all dashboard insights from the currently loaded images' parsed metadata without requiring the user to open any tool, and SHALL update insights automatically when images are added or removed. For large datasets the aggregation SHALL NOT block the UI from responding.

#### Scenario: Insights present without opening a tool
- **WHEN** images with parsed EXIF data are loaded and the user views the dashboard
- **THEN** location, device, timeline, software, and anomaly insights are already populated

#### Scenario: Insights refresh on dataset change
- **WHEN** an image is added to or removed from the dataset while the dashboard is visible
- **THEN** the affected insight values update without a manual refresh action

### Requirement: Dataset overview and EXIF coverage metrics
The dashboard SHALL show a dataset overview containing the total image count, count of images still processing, and coverage metrics: the number and percentage of images that have GPS coordinates, a capture timestamp, device information, and editing-software metadata.

#### Scenario: Coverage percentages
- **WHEN** 8 of 10 loaded images have GPS coordinates
- **THEN** the overview shows 8 images and 80% GPS coverage (and equivalent counts for other coverage metrics)

#### Scenario: Processing in progress
- **WHEN** some images are still being processed
- **THEN** the overview shows how many images are pending

### Requirement: Unique locations insight
The dashboard SHALL list unique locations in the dataset, using reverse-geocoded place names where available and falling back to coordinate clusters for un-geocoded GPS points. Each location entry SHALL show the number of images taken there, and the section SHALL indicate the count of unique locations and the number of images without any GPS data. Altitude information SHALL be shown when present.

#### Scenario: Locations with place names
- **WHEN** images carry reverse-geocoded location data
- **THEN** the dashboard lists each unique place name with its image count and total unique location count

#### Scenario: Ungrouped GPS points
- **WHEN** GPS coordinates exist but reverse geocoding is unavailable
- **THEN** the dashboard groups nearby coordinates into location entries with coordinate labels instead of place names

### Requirement: Unique devices insight
The dashboard SHALL list unique devices in the dataset, identifying each device by camera make and model. Each device entry SHALL show its image count, and the section SHALL indicate the total number of unique devices. Associated lens models, artist, copyright, and software values SHALL be surfaced with the device where present.

#### Scenario: Device inventory
- **WHEN** images were captured by an Apple iPhone 15 Pro and a Canon EOS R6
- **THEN** the dashboard lists both devices with their respective image counts and shows 2 unique devices

#### Scenario: Attribution metadata
- **WHEN** images carry artist or copyright values
- **THEN** those values are visible in the devices section rather than requiring the full EXIF view

### Requirement: Timeline of events
The dashboard SHALL build a timeline of events from image capture timestamps: a chronological ordering of capture times, the overall date range covered, activity by hour of day and day, and detection of burst sequences (multiple images taken within short intervals) and significant gaps in the timeline. Only images with actual capture timestamps SHALL be included; the dataset SHALL NOT be augmented with synthetic entries.

#### Scenario: Chronological events
- **WHEN** images have capture timestamps
- **THEN** the timeline lists capture events in chronological order with the covered date range

#### Scenario: Burst detection
- **WHEN** several images share capture times within a short interval
- **THEN** the timeline groups or flags them as a burst

#### Scenario: Images without timestamps excluded
- **WHEN** an image has no capture timestamp
- **THEN** it does not appear in the timeline and the missing count is accounted for in coverage metrics

### Requirement: Software and processing insight
The dashboard SHALL summarize editing-software findings across the dataset: which software values were detected, how many images show editing-software traces versus appear camera-original, and entry into the existing Software Processing tool for per-image detail.

#### Scenario: Edited ratio
- **WHEN** 3 of 10 images carry editing-software metadata
- **THEN** the dashboard shows the detected software values and a 3-of-10 edited indicator

### Requirement: Anomalies and investigator flags
The dashboard SHALL surface cross-cutting findings relevant to an investigation, including at minimum: images with GPS but no capture timestamp; images with timestamps but no GPS; suspiciously sparse or stripped metadata; the same location captured by multiple distinct devices; and resolution or orientation outliers relative to the dataset.

#### Scenario: GPS without timestamp
- **WHEN** an image has GPS coordinates but no capture timestamp
- **THEN** it is listed under the relevant anomaly flag

#### Scenario: Multi-device location
- **WHEN** one location contains images from two distinct devices
- **THEN** the dashboard flags that location as captured by multiple devices

### Requirement: Empty and sparse dataset states
When no images are loaded, the dashboard SHALL display a clear empty state explaining what the dashboard will show once images are added. When a dataset is too sparse for a given insight (for example, no GPS data at all), that section SHALL show an explicit no-data message instead of an empty or misleading chart.

#### Scenario: No images loaded
- **WHEN** the Investigations tab is opened with an empty dataset
- **THEN** the dashboard shows an empty state inviting the user to add images

#### Scenario: Section without data
- **WHEN** no images in the dataset have GPS coordinates
- **THEN** the locations section shows a no-location-data message rather than an empty list
