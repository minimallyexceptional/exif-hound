# Tasks

## 1. `packages/exif-insights` package scaffolding

- [x] 1.1 Scaffold `packages/exif-insights` mirroring `exif-middleware` conventions (package.json with tsup build esm+cjs+dts, strict tsconfig + tsconfig.typecheck.json, eslint); declare as workspace dependency of the desktop app and add the Vite alias `exif-insights` → `packages/exif-insights/dist`
- [x] 1.2 Add Jest to the package with `coverageThreshold` global 100% (branches/functions/lines/statements) wired into a `test` script; wire `npm test` for the package into the repo test flow
- [x] 1.3 Define public types (`InsightImage` input interface, `InvestigationInsights` snapshot) and normalize app `ImageData[]` → `InsightImage[]` at the desktop call site

## 2. Insights engine (OOP, in-package)

- [x] 2.1 Implement `InsightsEngine` facade class orchestrating the analyzer pipeline
- [x] 2.2 Implement `OverviewAnalyzer` (totals, processing count, coverage counts/percentages)
- [x] 2.3 Implement `LocationAnalyzer` (reverse-geocoded name groups, coordinate-cluster fallback, per-location counts, altitudes, device keys, no-GPS count)
- [x] 2.4 Implement `DeviceAnalyzer` (make+model fingerprints, counts, lenses, artist/copyright/software, unknown-device count)
- [x] 2.5 Implement `TimelineAnalyzer` (sorted events, range, byHour, byDay, burst detection, gap detection, timestamp-less count)
- [x] 2.6 Implement `SoftwareAnalyzer` (detected software values, edited vs camera-original)
- [x] 2.7 Implement `AnomalyAnalyzer` (gps-without-timestamp, timestamp-without-gps, sparse metadata, multi-device locations, resolution/orientation outliers)
- [x] 2.8 Unit tests for every analyzer + engine facade + edge cases (empty dataset, all-missing fields, mixed data) reaching the 100% coverage gate

## 3. Dashboard UI (reusable components, both themes)

- [x] 3.1 Rework `Investigation.tsx`: memoized `InsightsEngine` call; dashboard as default view; drill-in state machine to the four existing tools with back-to-dashboard affordance (preserve fullscreen + ESC handling for tool views)
- [x] 3.2 Build reusable primitives in `src/components/investigation/`: `InsightCard`, `InsightStat`, `CoverageBar`, `InsightList` — token-based styling only, selectable values, empty/no-data states built in
- [x] 3.3 Build overview strip section using `InsightStat`/`CoverageBar` (totals, processing count, coverage percentages)
- [x] 3.4 Build locations section (unique list w/ counts, altitude, no-GPS indicator, no-data state, drill-in to Geolocation Analysis)
- [x] 3.5 Build devices section (device list w/ counts, lens/attribution details, unknown-device count, drill-in to Pattern Analysis)
- [x] 3.6 Build timeline section (chronological events with capped rendering, date range, by-hour/by-day visx mini-bars, bursts/gaps, drill-in to Timeline Analysis)
- [x] 3.7 Build software section (detected software, edited ratio, drill-in to Software Processing Analysis)
- [x] 3.8 Build anomalies section (flagged image lists / counts with navigation where sensible)
- [x] 3.9 Empty state for zero images; per-section sparse/no-data states
- [x] 3.10 Theme + a11y verification: dark and light mode screenshots of every section and state; token audit (no literal colors), `selectable-value` on data values, reduced-motion, responsive above `lg`, keyboard/AT pass

## 4. Testing & validation

- [x] 4.1 Jest component tests for the dashboard (renders sections, drill-in/back navigation, empty state)
- [x] 4.2 Playwright E2E: dashboard view spec using existing fixtures (coverage counts, locations, devices, timeline visible; tool drill-in works)
- [x] 4.3 Run full gates: lint, typecheck, unit tests (incl. exif-insights 100% coverage), E2E suite, production build
- [x] 4.4 `openspec validate --all` passes; archive the change
