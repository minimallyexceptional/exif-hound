# Design

## Context

The Investigations tab (`apps/exif-hound-desktop/src/components/Investigation.tsx`) currently renders a tool-picker: four cards (Pattern/DeviceDendrogram, Geolocation, Timeline, Software Processing) that each take over the tab area when selected. EXIF is already extracted at upload time by `src/workers/exifWorker.ts` into `ImageData.exif` (GPS, `dateTimeOriginal`, make/model, lens, software, artist, copyright, dimensions, orientation…), and reverse-geocoded `ImageData.exif.location` is populated asynchronously by the existing Nominatim service. visx is already a dependency for visualizations. Jest tests cannot parse `import.meta`, so any worker must be constructed without `import.meta` (match the existing `exifWorker` pattern).

## Goals / Non-Goals

**Goals:**
- Dashboard-first landing view with continuously updated, dataset-wide insights.
- Zero re-parsing: consume already-extracted `ImageData.exif`; aggregation only.
- Keep the four existing tools untouched, reachable via drill-in.
- Responsive, non-blocking behavior for large datasets; respects existing styling/reduced-motion/selectable-value conventions.

**Non-Goals:**
- No changes to the four analysis tools' internals or props beyond where they're launched from.
- No new EXIF fields beyond what `exifWorker` already extracts.
- No persistence of insights across sessions; no export changes (export may be a follow-up).
- No backend/network calls beyond the existing reverse-geocoding service.

## Decisions

### 1. Aggregation lives in a dedicated shared package: `packages/exif-insights`
All insight logic lives in a new workspace package `packages/exif-insights` (mirroring `exif-middleware` conventions: private package, `tsup` build to `dist` esm+cjs with dts, strict tsconfig, eslint). The desktop app declares it as a workspace dependency, and a Vite alias maps `exif-insights` → `packages/exif-insights/dist` exactly like `exif-middleware`. Turbo's `^build` dependency orders the build automatically.

The package is written with OOP patterns: a facade `InsightsEngine` class owns the aggregation pipeline and delegates to focused analyzer classes (`OverviewAnalyzer`, `LocationAnalyzer`, `DeviceAnalyzer`, `TimelineAnalyzer`, `SoftwareAnalyzer`, `AnomalyAnalyzer`), each taking a normalized image-record input and returning its typed section. The engine accepts a minimal `InsightImage` interface (id + exif fields) so the package does not depend on app types; the app adapts `ImageData[]` to it at the call site. The UI computes the engine result with `useMemo(images, …)` — the per-image work is O(n) grouping/counting (EXIF parsing already happens off-thread in the upload worker), so no extra worker is needed; the class facade keeps that option open without changing call sites.

**Testing: 100% coverage gate.** The package runs Jest with `collectCoverageFrom: ['src/**/*.ts']` and `coverageThreshold: { global: { branches: 100, functions: 100, lines: 100, statements: 100 } }`; its `test` script fails below 100%. Every analyzer class has dedicated unit tests plus engine-facade and edge-case tests (empty dataset, all-missing fields, mixed data).

### 2. Insights result shape (single snapshot object)
```ts
interface InvestigationInsights {
  overview: { total, processing, withGps, withDateTime, withDevice, withSoftware };
  locations: { unique: Array<{ key, name?, lat, lon, count, altitudes?, devices? }>, noGps: number };
  devices:  { unique: Array<{ key, make?, model?, count, lenses, artists, software }> , unknownCount };
  timeline: { events: Array<{ id, dateTime, imageIds }>, range?: {start,end},
              byHour: number[24], byDay: {date, count}[], bursts: Array<{start,end,imageIds}>,
              gaps: Array<{start,end,durationMs}>, noTimestamp: number };
  software: { detected: Array<{ name, count }>, editedCount, cameraOriginalCount };
  anomalies: { gpsWithoutTimestamp: imageIds[], timestampWithoutGps: imageIds[],
               sparseMetadata: imageIds[], multiDeviceLocations: locationKeys[],
               resolutionOutliers: imageIds[], orientationOutliers: imageIds[] };
}
```
One snapshot keeps sections consistent (e.g., anomaly counts derived from the same groups shown in other sections) and makes testing straightforward.

### 3. Location grouping: reverse-geocode names first, coordinate-quantization fallback
Reuse `exif.location` when present (group key: `location.displayName || `${locality}, ${country}``-style cascade). For GPS points without a geocoded name, quantize to ~3-decimal grid (~100 m) cells and merge adjacent populated cells into a cluster centroid; label with formatted coordinates. Devices seen at each location are tracked to power the multi-device-location anomaly.

### 4. Timeline: chronological events + visx mini-visualizations
Events sorted ascending by `dateTimeOriginal`; images with identical timestamps merge into one event with an image count. Bursts = consecutive events within a 2-second threshold, same device. Gaps = intervals > 10% of total range (configurable constant). By-hour (24-slot histogram) and by-day (grouped by calendar date) bar summaries rendered with visx bars already in use. DST/timezone: `dateTimeOriginal` is treated as local naive time (standard OSINT practice for camera clocks); noted in UI copy as "camera clock time".

### 5. Anomaly detection rules (deterministic, in the same pure module)
- GPS without timestamp / timestamp without GPS: direct field checks.
- Sparse metadata: fewer than 3 of {dateTimeOriginal, make/model, gps, imageWidth/Height, software} present.
- Multi-device locations: ≥2 distinct device keys within one location group.
- Resolution outliers: dimensions outside the dataset's interquartile-ish band (simple: count per exact WxH; flag those <10% of dataset with WxH differing from the dominant size). Orientation outliers: orientation value differing from the dataset majority.

### 6. Dashboard layout & drill-in state machine
`Investigation.tsx` keeps its existing `selectedTool` state but gains a `null` default meaning "dashboard". The dashboard renders as a scrollable grid of section cards (overview strip on top; locations/devices/timeline/software/anomalies in a responsive grid; larger screens get 2–3 columns). Each card has a drill-in affordance; the four legacy tools render as before with a back-to-dashboard header button (existing `ArrowLeft` pattern).

UI follows the incumbent design system (DESIGN.md: dark-first "evidence board" tokens, Operate-dense mode):
- Reusable primitives under `src/components/investigation/` where patterns repeat: `InsightCard` (card shell: icon, title, subtitle, drill-in action, empty/no-data state), `InsightStat` (value + label pair for the overview strip), `CoverageBar` (mini horizontal coverage meter), `InsightList` (ranked entry list with counts). These compose every section and are theme-token-only so dark/light both work automatically.
- All colors via `app-*` tokens (never literal grays/hex); light theme is a pure token inversion so both themes are supported by construction, verified visually in both.
- Values displayed to the user get `selectable-value`; labels/chrome stay unselectable per repo convention. Reduced-motion respected (no non-instant transitions); hover states use `bg-app-gray-light/20` pattern already in the codebase.
- Density guidance from the incumbent system: information-dense but scannable — one glance per section card; counts lead, lists follow; drill-in affordance is an explicit button/chevron, not an invisible click target.

### 7. Keep tool launch semantics
The legacy tools receive `imagesWithDates` exactly as today; the dashboard never changes their inputs. Fullscreen toggle behavior is preserved for tool views.

## Risks / Trade-offs

- **Coordinate-cluster fallback grouping** can split/merge borderline clusters; acceptable for a summary view — Geolocation Analysis remains the precision tool. Constants centralized for tuning.
- **Timezone ambiguity** of `dateTimeOriginal` is inherent to the data; we label it rather than guess.
- **Large datasets**: timeline event list could grow; cap rendered rows with a "showing first N" pattern while keeping aggregate stats complete.
- **Reverse geocoding arrives async**: locations section keys off `exif.location` and re-renders when it populates (already flows through `images` state); until then coordinate labels show.
