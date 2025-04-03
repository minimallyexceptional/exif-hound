# Exif Hound - Electron Edition

A desktop application for viewing and analyzing EXIF data from images, built with Electron, React, and TypeScript.

## Features

- View EXIF data from images
- Display images on an interactive map using GPS coordinates
- Export EXIF data to CSV
- Drag and drop image upload
- Dark theme support
- Responsive design

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/exif-hound-electron.git
cd exif-hound-electron
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build the application:
```bash
npm run electron:build
```

## Development

The application is built using:
- Electron for the desktop framework
- React for the UI
- TypeScript for type safety
- Tailwind CSS for styling
- Vite for development and building

### Project Structure

```
exif-hound-electron/
├── electron/           # Electron main process files
│   ├── main.ts        # Main process entry point
│   └── preload.ts     # Preload script for IPC
├── src/               # React application source
│   ├── components/    # React components
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   └── ...           # Other source files
├── public/            # Static assets
└── ...               # Configuration files
```

### Key Components

- **Main Process**: Handles file system operations and window management
- **Renderer Process**: React application for the UI
- **Preload Script**: Safely exposes Electron APIs to the renderer process

## Building

The application can be built for multiple platforms:

- Windows: `npm run electron:build`
- macOS: `npm run electron:build`
- Linux: `npm run electron:build`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 