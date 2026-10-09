# Spec Delta

## REMOVED Requirements

### Requirement: Dashboard is the Investigations landing view
**Reason**: The Investigation tab is retired and the Workbench becomes the analysis workspace.
**Migration**: Use Workbench workflows to run image tools; use Map and List to inspect image metadata.

### Requirement: Insights aggregate in the background
**Reason**: Background dashboard aggregation belongs to the retired Investigation view.
**Migration**: No replacement aggregation is introduced; users can inspect images in Map and List and run tools in Workbench.

### Requirement: Dataset overview and EXIF coverage metrics
**Reason**: The dashboard displaying these metrics is removed.
**Migration**: No dashboard overview remains; image details continue to be available in Map and List.

### Requirement: Unique locations insight
**Reason**: The Investigation-only location summary is removed with its dashboard.
**Migration**: Inspect geotagged images in Map and their metadata in List.

### Requirement: Unique devices insight
**Reason**: The Investigation-only device summary is removed with its dashboard.
**Migration**: Inspect device metadata on images in List or the details panel.

### Requirement: Timeline of events
**Reason**: The Investigation-only timeline view is removed.
**Migration**: No timeline summary remains in the app; the Workbench is available for supported image-analysis workflows.

### Requirement: Software and processing insight
**Reason**: The Investigation-only software summary and drill-in view are removed.
**Migration**: Inspect software metadata on individual images in List or the details panel.

### Requirement: Anomalies and investigator flags
**Reason**: Cross-image anomaly summaries belong exclusively to the retired dashboard.
**Migration**: Inspect per-image metadata in Map and List; no automatic cross-image flags remain.

### Requirement: Empty and sparse dataset states
**Reason**: The Investigation dashboard and its empty and sparse states are removed.
**Migration**: Use the existing app empty state before images are loaded.
