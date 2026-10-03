# Exif Hound

A powerful desktop application for visualizing and managing EXIF data from your images.

## Features

- **Image Import**: Drag and drop or select multiple images
- **EXIF Data Extraction**: View detailed EXIF metadata including location, camera settings, and more
- **Map Visualization**: See where your photos were taken on an interactive map
- **Human-Readable Location Data**: Displays city, state, and country information based on GPS coordinates
- **Data Export**: Export EXIF data to JSON or CSV using native file dialogs
- **Customizable Map Styles**: Choose from different map styles for your viewing preference

## Technical Details

### Native File System Integration

The application uses Tauri's native file system APIs to provide a better user experience:

- Native file dialogs for saving data
- System-specific file handling
- Proper file type association

#### Implementation Details

- Uses the `@tauri-apps/plugin-dialog` for file save dialogs
- Uses the `@tauri-apps/plugin-fs` for file writing operations
- Includes browser fallback for handling edge cases

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Release Builds

Convenience script (from the repo root):

```bash
npm run build:release      # release build for the current platform
```

The script runs a full Tauri release build for "current hardware" targets:

| Host OS | Rust target |
|---------|-------------|
| macOS (Apple Silicon) | `aarch64-apple-darwin` (Intel is intentionally not supported) |
| Linux | `x86_64-unknown-linux-gnu` |
| Windows | `x86_64-pc-windows-msvc` |

Tauri cannot cross-compile between operating systems, so run the script on each
platform (e.g. a CI matrix) to produce Windows/Linux/macOS releases. Overrides:
`TAURI_TARGET=<rust triple>` (custom target) and `TAURI_BUNDLES="..."` (e.g.
`"dmg app"`, `"nsis"`, `"deb rpm"`).

## License

MIT 