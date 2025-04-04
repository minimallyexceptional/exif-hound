#!/bin/bash

# Build script for the EXIF Hound monorepo

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building EXIF Hound Monorepo${NC}"
echo "============================="

# Step 1: Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install
echo ""

# Step 2: Type check
echo -e "${GREEN}Type checking...${NC}"
npm run typecheck
echo ""

# Step 3: Build shared packages
echo -e "${GREEN}Building shared packages...${NC}"
npm run build:packages
echo ""

# Step 4: Build apps
echo -e "${GREEN}Building apps...${NC}"
npm run build:apps
echo ""

echo -e "${GREEN}Build complete!${NC}"
echo "The monorepo has been successfully built."
echo ""
echo "To run the desktop app in development mode:"
echo "npm run tauri:dev"
echo ""
echo "To build the desktop app for production:"
echo "npm run tauri:build" 