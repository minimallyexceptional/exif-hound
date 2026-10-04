# Proposal

## Why

KML import fails silently or rejects valid files. Root causes verified against the installed dependency versions (`@mapbox/leaflet-omnivore@0.3.4` → `togeojson@0.13.0`):

1. **Prefixed KML parses to zero features.** `togeojson@0.13.0` matches bare tag names via `querySelectorAll`, so KML documents using the `kml:` prefix (e.g. `<kml:Placemark>`, common in exports from QGIS and other GIS tools) return an empty FeatureCollection. The app then shows an empty layer with no error. Verified: a prefixed KML with one Placemark produces `features=[]`.
2. **Parse errors are swallowed.** `omnivore.kml.parse` fires an `'error'` event on the layer instead of throwing, so `parseImportData` resolves successfully with an empty layer and the user gets no feedback.
3. **The marker-suppression option is ignored.** `kmlParse` creates `L.geoJson()` without the caller's options, so the passed `style.pointToLayer` never applies (it is also mis-nested under `style`). If a correctly-passed `pointToLayer` returned `null`, Leaflet would throw (`layer.feature = ...` on null).
4. **Valid KML without an XML declaration is rejected.** `ImportModal` requires `text.includes('<?xml')`, but such KML is valid and parses fine (verified).

## What Changes

- Parse KML with a modern converter (`@tmcw/togeojson`) + `DOMParser` directly in `parseImportData`, replacing the `leaflet-omnivore` KML path (the dependency stays for its other loaders; KML parsing no longer routes through it).
- Build the returned Leaflet layer from the parsed FeatureCollection with proper `L.geoJSON` options (no default markers; consistent styling handled by `MapLayers`).
- Surface malformed/unparseable KML as a rejected promise so the existing `importError` UI shows a meaningful message.
- Relax `ImportModal` KML validation: require parseable KML content, not an `<?xml` declaration.
- Keep the public contract of `ImportedData` unchanged (`type`, `data`, `layer`); `points` for KML remains out of scope (CSV-only behavior preserved).

## Capabilities

### New Capabilities
- `kml-import`: Parsing of user-provided KML files into map-ready layers with correct error reporting, covering namespace-prefixed documents, malformed XML, and files without XML declarations.

### Modified Capabilities

(none — `openspec/specs` has no existing capabilities)

## Impact

- **Code**: `apps/exif-hound-desktop/src/utils/importData.ts` (KML branch), `apps/exif-hound-desktop/src/components/ImportModal.tsx` (validation only). No changes expected in `MapLayers.tsx` — it already renders from `layer.toGeoJSON()` and its input contract is unchanged.
- **Dependencies**: add `@tmcw/togeojson` (with `@types/geojson` already transitively present) to `apps/exif-hound-desktop`.
- **Risk**: low — KML branch is isolated; CSV path untouched.