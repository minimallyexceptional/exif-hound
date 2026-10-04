# Tasks

## 1. Dependency and parsing core

- [x] 1.1 Add `@tmcw/togeojson` to `apps/exif-hound-desktop` dependencies and install; verify with `node -p "require('@tmcw/togeojson/package.json').version"`.
- [x] 1.2 Rewrite the KML branch of `parseImportData` in `apps/exif-hound-desktop/src/utils/importData.ts`: DOMParser → parsererror/detection → KML root check → `togeojson.kml(doc)` → empty-features rejection → `L.geoJSON(fc)` layer. Verify: unit test covering prefixed KML, unprefixed KML, malformed XML, non-KML XML, declaration-less KML, and mixed geometry (see 3.1).
- [x] 1.3 Remove the now-unused `@mapbox/leaflet-omnivore` import from `importData.ts` (keep the package in dependencies per design Non-Goals). Verify: `rg -n omnivore apps/exif-hound-desktop/src/utils/importData.ts` returns nothing and typecheck passes.

## 2. Import modal validation

- [x] 2.1 In `apps/exif-hound-desktop/src/components/ImportModal.tsx`, replace the `<?xml` requirement with a case-insensitive check for KML content (`<kml` or `<kml:`), letting `parseImportData` reject malformed XML. Verify: unit test asserting a declaration-less KML passes the pre-check and a text file without KML content fails.

## 3. Tests and verification

- [x] 3.1 Add `apps/exif-hound-desktop/src/__tests__/utils/importData.test.ts` covering all `kml-import` spec scenarios (prefixed/unprefixed placemarks, mixed geometry, malformed XML rejection, non-KML XML rejection, declaration-less success, no-default-marker layer construction). jsdom is available for `DOMParser`. Verify: `npx vitest run src/__tests__/utils/importData.test.ts` (or repo test runner) passes.
- [x] 3.2 Run typecheck and lint for the desktop app (`npm run typecheck`/`lint` via turbo workspace). Verify: no new errors.
- [ ] 3.3 Manual smoke: `npm run dev` the desktop app, import `test.kml` fixtures (prefixed and unprefixed) through the Import modal, confirm placemarks render as GeoJSON circles and bounds fit. Verify: observable in the running app.

## 4. OpenSpec closure

- [ ] 4.1 `openspec validate --all` passes.
- [ ] 4.2 Archive the change with `openspec archive fix-kml-parsing` after implementation and validation are complete.