# EXIF Hound Monorepo

A monorepo for EXIF Hound applications and packages, using Turborepo.

## What's inside?

This monorepo uses [Turborepo](https://turbo.build/repo) for build system and workspace management.

### Apps and Packages

- `apps/exif-hound-desktop`: A Tauri-based desktop application for EXIF metadata analysis
- `packages/shared-utils`: Common utilities for formatting and data processing
- `packages/exif-middleware`: EXIF processing and metadata extraction utilities

## Current Status

The monorepo setup is now complete with the following structure:

```
exif-hound-monorepo/
├── apps/
│   └── exif-hound-desktop/  # Tauri desktop app
├── packages/
│   ├── shared-utils/        # Common utilities
│   └── exif-middleware/     # EXIF processing logic
├── turbo.json               # Turborepo config
├── build.sh                 # Unix build script
├── build.bat                # Windows build script
└── package.json             # Workspace config
```

Implementation status:

1. ✅ Create monorepo structure
2. ✅ Set up Turborepo configuration
3. ✅ Move existing application to `apps/exif-hound-desktop`
4. ✅ Create basic shared packages
5. ✅ Fix dependencies between packages and applications
6. ✅ Set up build and development workflows
7. ✅ Update paths and imports in application code
8. ✅ Fix TypeScript project references

## Development

To develop all apps and packages, run the following command:

```bash
# Build packages first, then start development
npm run build:packages
npm run dev
```

To develop only the shared packages:

```bash
npm run dev:packages
```

To run just the desktop application:

```bash
npm run tauri:dev
```

## Building

The easiest way to build is using the provided build scripts:

```bash
# On Unix/Linux/macOS
./build.sh

# On Windows
build.bat
```

Alternatively, you can run the build steps manually:

```bash
# Type check all packages and apps
npm run typecheck

# Build all packages and apps
npm run build

# Or build just packages
npm run build:packages

# Or build just apps
npm run build:apps

# Build the desktop application
npm run tauri:build
```

## Technology Stack

- Frontend: React, TypeScript, Vite, TailwindCSS
- Backend: Tauri (Rust)
- Map: Leaflet/React-Leaflet
- Image Processing: ExifReader
- Build System: Turborepo

## Automatic Updates

Community and Pro receive automatic updates through separate, signed feeds
(`updates.exifhound.com/<edition>/<channel>/latest.json`). The updater is
privacy-first and anonymous — see [docs/updater.md](./docs/updater.md) for the
architecture, privacy contract, signing keys, and release runbooks.

## Further Documentation

For more details about the monorepo migration process, see [MONOREPO_MIGRATION.md](./MONOREPO_MIGRATION.md).

## License

MIT 