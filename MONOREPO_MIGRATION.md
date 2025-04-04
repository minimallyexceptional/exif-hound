# Monorepo Migration Guide

This document outlines the steps taken to convert the EXIF Hound application from a single project to a Turborepo monorepo structure.

## Completed Steps

1. **Set Up Monorepo Structure**
   - Created top-level package.json with workspace configuration
   - Added Turborepo as a development dependency
   - Created turbo.json with pipeline configurations
   - Set up apps/ and packages/ directories

2. **Migrate Existing Application**
   - Moved the existing Tauri application to apps/exif-hound-desktop
   - Copied all source code, configuration files, and assets
   - Set up application-specific package.json

3. **Create Shared Packages**
   - Created shared-utils package with common utilities
   - Created exif-middleware package for EXIF processing logic
   - Set up package.json, tsconfig.json, and basic source files for each package

4. **Update Configurations**
   - Updated root .gitignore and added app-specific .gitignore
   - Updated README files with monorepo information
   - Added TypeScript path configuration for importing shared packages
   - Updated Vite configuration to resolve monorepo packages

5. **Fix Package Dependencies**
   - Added package references in app package.json
   - Configured proper dependency graph in turbo.json
   - Added build scripts for packages to ensure proper build order

6. **Create Integration Example**
   - Created a demo file that uses both shared packages
   - Set up proper type imports and function usage

7. **Fix TypeScript Project References**
   - Added `composite: true` to all referenced project tsconfig files
   - Fixed workspace package dependencies in package.json files
   - Updated tsconfig files with proper references between packages
   - Added typecheck scripts to validate types across the monorepo
   
8. **Fix Build Issues**
   - Updated Turborepo from `pipeline` to `tasks` syntax for v2.0 compatibility
   - Used direct relative imports between packages to avoid TypeScript path resolution issues
   - Simplified tsconfig settings by removing rootDir constraints
   - Set up proper build scripts to handle dependencies correctly

## Challenges Solved

1. **TypeScript Project References**: Configured TypeScript project references between packages to ensure type safety and proper build order.

2. **Build Order Dependencies**: Used Turborepo's task configuration to ensure packages are built before apps that depend on them.

3. **Module Resolution**: Used relative imports between packages to avoid path resolution issues during build.

4. **Declaration Files**: Simplified the build process to handle declaration files properly for workspace packages.

5. **Turborepo Configuration**: Updated to v2.0 syntax for better pipeline configuration.

## Current Status

The monorepo setup is now fully functional with the following structure:

```
exif-hound-monorepo/
├── apps/
│   └── exif-hound-desktop/
│       ├── src/
│       │   └── utils/
│       │       └── exif.ts    # Uses shared packages
│       ├── src-tauri/
│       ├── package.json
│       └── vite.config.ts
├── packages/
│   ├── shared-utils/
│   │   ├── src/
│   │   │   └── index.ts      # Common utilities
│   │   └── package.json
│   └── exif-middleware/
│       ├── src/
│       │   └── index.ts      # EXIF processing logic
│       └── package.json
├── turbo.json
├── build.sh                   # Unix build script
├── build.bat                  # Windows build script
└── package.json
```

## Build and Development

To build all packages first, then apps:
```bash
# Run the build script which includes type checking
./build.sh  # Unix
build.bat   # Windows

# Or manually:
npm run typecheck
npm run build:packages
npm run build:apps
```

To run the desktop application in development mode:
```bash
npm run tauri:dev
```

This will automatically build any dependent packages first due to the turbo.json configuration.

## Remaining Tasks

1. **Extract More Shared Logic**
   - Further refactor the application to leverage shared packages
   - Move more EXIF-specific logic to exif-middleware

2. **Update Tests**
   - Set up tests for shared packages
   - Ensure application tests still work with shared dependencies

3. **CI/CD Integration**
   - Update any CI/CD pipelines for the monorepo structure
   - Set up caching for Turborepo

## Future Considerations

- Add additional applications (web, mobile versions)
- Extract more shared functionality into packages
- Consider setting up a component library package
- Add end-to-end tests across the entire monorepo 