# Exif Hound Pro

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

## License

MIT 