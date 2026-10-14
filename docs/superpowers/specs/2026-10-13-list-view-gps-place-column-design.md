# List view GPS Place column

**Date:** 2026-10-13  
**Status:** draft, pending user review

## Goal

Show reverse-geocoded place names in List view, and make GPS columns visible by default so users do not have to turn the GPS Data group on.

## Columns

The existing **GPS Data** column group in `ImageList` is **on by default**, alongside File Information and Temporal Data. Reset Columns restores those three groups.

Order inside GPS Data:

1. **Place** (~220px) — `image.exif.location.formatted` when it is a non-empty string; otherwise `—`
2. **Latitude** — unchanged (`{value}°` or `—`)
3. **Longitude** — unchanged
4. **Altitude** — unchanged

Place is the full Nominatim `display_name` (same source as Evidence Place). The cell is single-line; the full string is available via the grid cell `title` tooltip. Place is not sortable.

`—` covers: no GPS, no location object, empty/whitespace `formatted`, lookup still loading, or lookup error. The list does not show a separate loading label.

## Data flow

List view only **reads** `image.exif.location`. It does not call Nominatim.

Lookups stay where they already are:

- Upload, when Settings → place names is on
- Evidence compilation, when that setting is on (existing `resolveMissingGpsPlaceNames` path)

App session `images` is the source of truth. After Evidence patches locations, List shows the new Place values on the next render.

## Out of scope

- New network lookups from List view
- Persisting place names to the project store
- Sorting by Place
- Changing Evidence Place formatting
- Persisting column-visibility choices across sessions (still in-memory `useState`)

## Tests

Add `ImageList` unit tests (none exist today besides performance virtualization):

- On a default mount, column headers include Place, Latitude, Longitude, and Altitude (GPS group enabled without opening Columns).
- A row with `exif.location.formatted = "Tower Bridge, …"` shows that string in Place.
- A row with no location, empty `formatted`, or GPS coords only shows `—` in Place.
- Reset Columns restores GPS headers after the GPS group has been turned off.

Existing list-view Playwright coverage (`views.spec.ts`) stays valid; it does not assert hidden GPS headers.

## Implementation notes

- Change `COLUMN_GROUPS` in `apps/exif-hound-desktop/src/components/ImageList.tsx`: `gps.defaultEnabled = true`; insert Place as the first GPS column.
- Reuse the group’s `na()` / empty-cell convention; do not add a new geocoding helper.
- Place cells use `selectable-value`. Pass `cellClassName` through ImageList’s `gridColumns` mapping; do not change other list columns.
- OpenSpec: new change `list-view-gps-place-column` before application code. Display-only; does not alter Nominatim lookup policy.
