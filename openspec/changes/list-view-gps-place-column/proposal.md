# Proposal: List view GPS Place column

## Why
Evidence already shows a Place label from reverse geocoding. List view has Latitude, Longitude, and Altitude, but they are off by default and there is no Place column, so investigators cannot scan place names in the spreadsheet.

## What Changes
- Enable the GPS Data column group by default in List view.
- Add a Place column as the first GPS column, showing `exif.location.formatted` (or "—").

## Impact
- `apps/exif-hound-desktop`: `ImageList` column groups and tests.

## Out of Scope
- Nominatim lookups from List view.
- Persisting place names or column visibility.
- Changing Evidence Place formatting.
