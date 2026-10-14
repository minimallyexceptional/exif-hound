# Proposal: Persist EXIF write-then-reload

## Why
Upload already writes extracted EXIF to `images.exif_json`, but the session keeps using the in-memory extract. `addImage` even SELECTs the new row and then returns the input object. After a successful save, the UI should show the database copy.

## What Changes
- `ProjectStore.addImage` returns EXIF parsed from the inserted `exif_json` row, not the function argument.
- After persist, App replaces that image's `exif` and `projectImageId` from the saved record.
- Session identity (`id`, blob `url`, `file`) is preserved so selection and the gallery do not reset.

## Impact
- `packages/investigation-archive`: `ProjectStore.addImage` return value.
- `apps/exif-hound-desktop`: persist hydrate mapper and `persistImage` in `App.tsx`.

## Out of Scope
- Query-on-demand (removing EXIF from `ImageData`).
- Persisting later EXIF mutations (GPS place names).
- Storing full ExifReader tag maps.
- CSV import hydrate.
- Schema migration (`exif_json` already exists).
