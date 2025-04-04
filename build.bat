@echo off
echo Building EXIF Hound Monorepo
echo =============================

:: Step 1: Install dependencies
echo Installing dependencies...
call npm install
echo.

:: Step 2: Type check
echo Type checking...
call npm run typecheck
echo.

:: Step 3: Build shared packages
echo Building shared packages...
call npm run build:packages
echo.

:: Step 4: Build apps
echo Building apps...
call npm run build:apps
echo.

echo Build complete!
echo The monorepo has been successfully built.
echo.
echo To run the desktop app in development mode:
echo npm run tauri:dev
echo.
echo To build the desktop app for production:
echo npm run tauri:build 