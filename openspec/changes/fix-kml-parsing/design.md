# Design — fix-kml-parsing

## Context

`parseImportData` in `apps/exif-hound-desktop/src/utils/importData.ts` routes KML
through `omnivore.kml.parse` (from `@mapbox/leaflet-omnivore@0.3.4`). That package
pins `togeojson@0.13.0`, which cannot match namespace-prefixed KML elements, and
its `kmlParse` ignores caller options and reports failures by firing an `'error'`
event on the returned layer rather than throwing — so failures reach the UI as a
successful, empty import. The renderer (WebView) provides `DOMParser`; no Node
parser is needed. See proposal.md for verified root causes.

## Goals / Non-Goals

**Goals**

- Correct, observable parse results for prefixed and unprefixed KML.
- Failures surface through the existing `importError` flow in `App.tsx`.
- Keep `ImportedData`'s shape and `MapLayers.tsx`'s input contract unchanged.

**Non-Goals**

- Producing `points` for KML (list/gallery entries) — CSV-only behavior preserved.
- Supporting KMZ (zipped) files, GPX, or other formats.
- Changing KML rendering style in `MapLayers.tsx`.
- Upgrading or removing `@mapbox/leaflet-omnivore` (its CSV/WKT loaders are not
  used here either, but removal is out of scope for this fix).

## Decisions

### 1. Replace the omnivore KML path with `@tmcw/togeojson` + `DOMParser`

`@tmcw/togeojson` (current, maintained successor of the `togeojson` fork
omnivore pins) handles ExtendedData and gx coordinates, and is a pure function
over a parsed XML `Document` — parse errors are visible
to us, not swallowed inside a layer event.

**Namespace-prefix caveat (verified):** `@tmcw/togeojson` still locates
Placemarks with bare `getElementsByTagName('Placemark')`, which does not match
`kml:Placemark` (confirmed in Chromium and jsdom). The KML branch therefore
normalizes the parsed document when any element in the KML namespace carries a
prefix: rebuild the tree into a fresh document, renaming KML-namespace
elements to their unprefixed local names (namespace URI preserved) while
leaving other namespaces (e.g. `gx:`) untouched so extension-element matching
still works. Unprefixed documents skip the rebuild entirely.
and is a pure function over a parsed XML `Document` — parse errors are visible
to us, not swallowed inside a layer event.

Flow inside `parseImportData`'s KML branch:

1. `new DOMParser().parseFromString(text, 'text/xml')`.
2. Check `document.getElementsByTagName('parsererror')` (and empty
   `documentElement` for the Chrome-throw case) → reject with a descriptive
   error.
3. Verify the root/first element is KML (`kml` local name or KML namespace) →
   reject "no KML content" otherwise.
4. `togeojson.kml(doc)` → FeatureCollection; empty `features` → reject with
   "no KML content was found".
5. Build `L.geoJSON(fc, { pointToLayer: (_f, latlng) => L.circleMarker(latlng) })`
   as the returned `layer`.

**Alternatives considered**

- *Fix options passed to omnivore* — rejected: the library's `kmlParse` ignores
  them by construction; we'd still be pinned to `togeojson@0.13.0`.
- *Vendored fork of old togeojson* — rejected: maintenance burden; `@tmcw/togeojson`
  is the maintained upstream of the same code.
- *Regex/manual XML parsing* — rejected: unsafe and incomplete for KML.

### 2. Relax `ImportModal` validation to structure, not declaration

Replace the `text.includes('<?xml')` + `text.includes('<kml')` check with a
check for KML content (`<kml` or `<kml:` substring, case-insensitive) and let
`parseImportData` be the authority on malformed XML. This keeps the modal's
cheap pre-check while no longer rejecting declaration-less KML.

### 3. Suppress markers via `pointToLayer` returning a non-marker layer

Returning `null` from `pointToLayer` throws inside Leaflet's `addData`
(`layer.feature = ...` on null), and *omitting* `pointToLayer` is not an
option either: Leaflet's default `pointToLayer` creates default marker icons
for Point features (verified against Leaflet 1.9.4). Instead, both the parser
and `MapLayers`' `<GeoJSON>` pass `pointToLayer` returning an unstyled
`L.circleMarker` (styled by the map component), which creates no marker
icons and still contributes correct bounds.

## Risks / Trade-offs

- [New runtime dependency in the renderer bundle] → `@tmcw/togeojson` is small,
  tree-shakeable, and replaces functionality currently pulled in via omnivore's
  old `togeojson`; net bundle impact ≈ neutral.
- [`parsererror` detection differs across engines (Chromium/WebKit)] → check
  both the WebKit inline `parsererror` element and the `documentElement` being
  null/`parsererror` (Chrome/WebView2); tests cover the failure path.
- [Behavior change: previously-"successful" empty imports now error] → this is
  the intended fix; error message is user-actionable ("could not be parsed").

## Migration Plan

Single-renderer change; no persisted data involved. Roll back by reverting the
two files and dropping the dependency. No data migration.

## Open Questions

None.