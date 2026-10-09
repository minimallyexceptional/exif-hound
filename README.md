# Exif Hound

[![CI](https://github.com/minimallyexceptional/exif-hound/actions/workflows/ci.yml/badge.svg)](https://github.com/minimallyexceptional/exif-hound/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Latest release](https://img.shields.io/github/v/release/minimallyexceptional/exif-hound)](https://github.com/minimallyexceptional/exif-hound/releases/latest)

Privacy-first desktop app for inspecting image EXIF metadata, mapping photo
locations, and organizing investigations. **All processing happens locally on
your device** — image data, metadata, filenames, and investigation data are
never transmitted.

## Features

- **EXIF inspection** — full metadata browsing for any image, with comparison
  and export
- **Location map** — plot GPS-tagged photos on an interactive map, view routes
  and clusters (Leaflet)
- **List view** — spreadsheet-style navigation across imported images
- **Import/export** — KML import, CSV/JSON export of metadata
- **Automatic updates** — signed, verified updates delivered through the
  built-in updater; no account, no telemetry

## Download

Grab the latest signed installer for your platform from the
[releases page](https://github.com/minimallyexceptional/exif-hound/releases/latest)
(macOS Apple Silicon, Windows x64, Linux x64 and ARM64). Installed apps update
themselves automatically over the signed update feed — see
[docs/updater.md](./docs/updater.md).

## Repository layout

npm workspaces + Turborepo monorepo:

| Path | What it is |
| --- | --- |
| `apps/exif-hound-desktop` | The desktop app: Tauri 2 + React 19 + Vite + Tailwind CSS 4 + TypeScript; EXIF parsing in a Web Worker; Map, List, and Workbench views |
| `apps/exif-hound-website` | Companion website |
| `packages/exif-middleware` | Shared EXIF processing middleware (consumed by the desktop app via a Vite alias) |

## Development

Prerequisites: **Node.js >= 20** (npm, not yarn/pnpm), **Rust stable**, and on
Linux the webkit2gtk-4.1/GTK build deps. Full setup and rules in
[CONTRIBUTING.md](./CONTRIBUTING.md).

```bash
npm install             # installs workspaces + Husky hooks
npm run build:packages
npm run tauri:dev       # desktop app in dev mode
```

Quality gates run automatically on every commit (lint, typecheck, unit tests,
and a production build). Playwright E2E tests run in CI on pull requests.

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) — setup, rules, OpenSpec feature workflow
- [docs/updater.md](./docs/updater.md) — automatic updates, signing, release flow
- [SECURITY.md](./SECURITY.md) — reporting vulnerabilities, security design

## License

[MIT](./LICENSE)
