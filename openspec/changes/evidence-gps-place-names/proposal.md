# Proposal: Place names when compiling GPS evidence

## Why
Place-name lookup currently runs only at upload. GPS evidence already has a Place column, but it is empty unless `exif.location` was filled then. Images uploaded with the setting off, or restored from a project, show "—" even when reverse geocoding is now enabled.

## What Changes
- When compiling GPS evidence, if Settings → place names is on, look up missing labels with the existing Nominatim helper.
- Write results back onto session `image.exif.location` so EXIF details and the map pick them up.
- Skip images that already have a formatted place name. Do not persist via `addImage` (would duplicate rows).

## Impact
- `apps/exif-hound-desktop`: evidence hub load path, Evidence view callback, App image state, Settings copy.

## Out of Scope
- New `ProjectStore` EXIF update API / surviving reopen without a re-lookup.
- Progressive Place-column fill while lookups are in flight.
