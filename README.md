# Exif Hound Pro

A cross-platform desktop application for exploring and visualizing image metadata, including GPS coordinates and camera settings.

## Features

- Import images and extract EXIF metadata
- View image locations on an interactive map
- Display detailed EXIF information including camera settings
- Plot routes between geo-tagged images
- Dark mode support
- Export metadata to various formats

## Development

### Prerequisites

1. Node.js (v16+)
2. Rust (latest stable version)
3. Tauri setup requirements:
   - Windows: Microsoft Visual Studio C++ Build Tools
   - macOS: Xcode Command Line Tools
   - Linux: Various development libraries (see Tauri docs)

### Setup

1. Clone the repository
2. Install dependencies

```bash
npm install
```

3. Run the development server

```bash
npm run tauri:dev
```

4. Build the application

```bash
npm run tauri:build
```

## Technology Stack

- Frontend: React, TypeScript, Vite, TailwindCSS
- Backend: Tauri (Rust)
- Map: Leaflet/React-Leaflet
- Image Processing: ExifReader

## License

MIT 