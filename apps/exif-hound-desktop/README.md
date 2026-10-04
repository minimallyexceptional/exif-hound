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

```bash
npm run tauri:build        # Tauri release build for the current platform
```

Tauri builds for the current host target and cannot cross-compile between
operating systems, so run the build on each platform (e.g. a CI matrix) to
produce Windows/Linux/macOS releases. Extra bundle targets can be passed
through: `npm run tauri:build -- --bundles "nsis"`.

### End-to-End Tests (Cypress)

Cypress runs the real UI in a browser against a dedicated Vite dev server
(`dev:test`, port 5276) with the Tauri bridge mocked in `cypress/support/tauri-mock.ts`,
so tests exercise the app without building or launching the native shell.

```bash
npm run cy:run              # headless run (starts the dev server itself)
npm run cy:open             # interactive Cypress launcher
```

Canned Tauri command responses are registered per test:

```ts
cy.visit('/', {
  onBeforeLoad(win) {
    installTauriMock(win, { 'plugin:app|version': '2.5.2' });
  },
});
```

Notes:

- The mock is installed in `onBeforeLoad`, before app code runs, so the app
  boots in "Tauri available" mode. Unknown commands reject loudly — register
  canned responses for every command a test path touches.
- The viewport is 1600×900 (desktop layout). Keep selectors above the `lg`
  breakpoint working.
- On some Linux desktop setups the bundled Electron browser hangs while
  capturing failure screenshots. If a failure report stalls, run the suite
  with system Chromium using `npm run cy:run:chromium`.
- `cypress/videos`, `cypress/screenshots`, and `cypress/downloads` are gitignored.

## License

MIT
