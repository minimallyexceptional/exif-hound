# Proposal

## Why

The Investigations tab currently opens on a flat list of four analysis tools and nothing else; an investigator must open each tool one at a time to learn anything about the dataset. Uploading a batch of images produces rich EXIF data (GPS, capture times, devices, lenses, software, settings) that is never summarized. A dashboard that continuously aggregates and surfaces dataset-wide insights gives an OSINT investigator an immediate analytical picture — who/what captured the images, where, and in what order — with drill-down into the existing deep-analysis tools.

## What Changes

- **Redesign the Investigations main page as a dashboard** that replaces the tool-list landing view. The four existing tools (Pattern Analysis, Geolocation Analysis, Timeline Analysis, Software Processing) are kept and reachable from the dashboard via drill-in (cards/sections link into them; tool UIs are unchanged).
- **Background insights engine**: a memoized aggregation layer (web worker-backed where cost warrants) that processes all loaded `ImageData[]` and computes dataset-wide insights, updating automatically as images are added/removed.
- **Insight sections on the dashboard**, including:
  - *Dataset overview*: total images, processing status, and EXIF coverage metrics (% with GPS, capture time, device, software).
  - *Locations*: unique locations (reverse-geocoded place names with GPS-cluster fallback), images per location, altitude range, and quick jump into Geolocation Analysis.
  - *Devices*: unique device fingerprints (make+model), per-device image counts, lens inventory, artist/copyright attribution, and quick jump into Pattern Analysis.
  - *Timeline of events*: chronological event list/build-up of capture times, activity by hour and by day, burst detection, date-range span, largest gaps, and quick jump into Timeline Analysis.
  - *Software & processing*: detected editing software per image, edited-vs-camera-original ratio, and quick jump into Software Processing Analysis.
  - *Anomalies & investigator flags*: images with GPS but no capture time, capture times without GPS, metadata stripped/suspiciously sparse files, device↔location cross-links (same location captured by multiple devices), timezone/suspected-clock-skew hints, resolution/orientation outliers.
- **No changes to how EXIF is extracted** at upload; the dashboard consumes the already-parsed `ImageData[].exif` records and reverse-geocoded `location` data.

## Capabilities

### New Capabilities
- `investigations-dashboard`: The Investigations tab's dataset-insights dashboard — background aggregation of EXIF data into OSINT insight sections (overview, locations, devices, timeline, software, anomalies) and drill-in access to the existing analysis tools.

### Modified Capabilities
<!-- None: the existing analysis tools' behavior is unchanged; feature-flag gating of the tab is unchanged. -->

## Impact

- **Code**: `apps/exif-hound-desktop/src/components/Investigation.tsx` (new dashboard layout + drill-in state machine); new `src/components/investigation/` dashboard sections; new insights aggregation module (e.g. `src/utils/investigationInsights.ts` or worker); types in `src/types.ts` if insight result types are added.
- **Performance**: aggregation must be memoized and worker-friendly for large datasets (consistent with existing `exifWorker` pattern); no blocking of the UI thread on large sets.
- **Styling**: token-based Tailwind utilities only (`text-app-*`, `bg-app-*`); values displayed in insight sections must use the `selectable-value` class per UI conventions.
- **Tests**: new Jest unit tests for the insights aggregation logic; E2E additions for the dashboard view under `playwright/e2e/` (fixtures already provide known EXIF/GPS values).
- **No dependencies** beyond what exists (visx, lucide-react, Leaflet already in use).
