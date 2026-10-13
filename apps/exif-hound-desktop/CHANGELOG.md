# Changelog

All notable changes to the EXIF Hound desktop app are documented in this file.

## 2.7.0

### Fixed

- **Linux updates:** In-app updates work for `.deb` and `.rpm` installs. The release feed now publishes signed `linux-*-deb` and `linux-*-rpm` manifest entries, and mismatched updater formats surface a clear GitHub Releases fallback message.

## 2.6.9

### Fixed

- **Place names:** Reverse geocoding works again in packaged builds. Nominatim is now allowed on the Tauri `http:default` scope, and lookups no longer set a `User-Agent` header that WebKit rejects.

## 2.6.7

### Added

- **Settings About:** GitHub Sponsor action sits beside "Star on GitHub" and opens the maintainer Sponsors page in the system browser.

### Changed

- **Branding:** User-facing product name is consistently "EXIF Hound".

### Fixed

- **Settings startup:** Corrupt or blocked `localStorage` for map/privacy settings no longer crashes the app; reads and writes fall back to safe defaults.
- **EXIF panel:** `ExifErrorBoundary` remounts when the selected image changes so a prior EXIF render error does not block other images.
- **Reverse geocoding privacy:** Nominatim reverse requests no longer include a contact email query parameter; the app identifies itself with a `User-Agent` header and sends only GPS coordinates when geocoding is enabled.
- **Clipboard:** Lens and GPS EXIF fields copy nested rational values as fractions (for example `180/1, 10/1`) instead of garbled array text.
- **CSP:** Added `ipc:` to `connect-src` so Tauri IPC works under the tightened content security policy.

### Included from earlier 2.6.7 work

- CSV import with empty `file.type`, opt-in reverse geocoding, bundled map style previews, CSP and capability tightening, Full EXIF tag grouping fixes, map control click propagation, and related community-reported fixes (see pull request #13).
