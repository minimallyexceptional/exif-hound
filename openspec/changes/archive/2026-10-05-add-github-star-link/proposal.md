# Proposal

## Why

Users need a direct way to support Exif Hound on GitHub from within the desktop app.

## What Changes

Add a “Star on GitHub” action immediately below “Check for Updates” in the mobile menu. It opens https://github.com/minimallyexceptional/exif-hound in the system browser.

## Capabilities

### New Capabilities
- `github-support-link`: Users can open the Exif Hound GitHub repository from the app using a clearly labeled action below the update check.

### Modified Capabilities
- None.

## Impact

- UI: `apps/exif-hound-desktop/src/components/AppHeader.tsx`.
- External destination: project GitHub repository.
