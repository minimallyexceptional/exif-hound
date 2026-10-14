# Design: GPS evidence place names

## Trigger
Evidence hub `loadIndex` (open + refresh). Gated by `privacySettings.reverseGeocoding`. Off = copy existing `exif.location.formatted` only.

## Lookup
Reuse `getLocationFromCoordinates` (in-memory cache + 1.1s Nominatim rate limit). Inject a lookup in tests. Skip non-GPS images and images that already have a non-empty `formatted` label. Failed or empty lookups leave Place as "—".

## Write-back
Return patches `{ id, location }`. Apply a copy of images for index build. `EvidenceView` calls `onImagesPatched`; App merges into `images`. Do not call `persistImage`.

## Loop
Patching images recreates the hub service and reloads once. The second pass finds formatted names and issues no lookups.
