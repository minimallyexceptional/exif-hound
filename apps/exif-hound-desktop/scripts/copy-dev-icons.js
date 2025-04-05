/**
 * This script copies icon files from src-tauri/icons to the development resources directory
 * to ensure icons are available during development.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the source icons
const iconsSourceDir = path.resolve(__dirname, '..', 'src-tauri', 'icons');
console.log(`Source icons directory: ${iconsSourceDir}`);

// Make sure source directory exists
if (!fs.existsSync(iconsSourceDir)) {
  console.error(`Error: Source icons directory doesn't exist at ${iconsSourceDir}`);
  process.exit(1);
}

// Determine target directory based on the OS
let targetDir;

if (process.platform === 'win32') {
  // For Windows, create target directory in debug resources 
  targetDir = path.resolve(__dirname, '..', 'src-tauri', 'target', 'debug', 'resources');
} else if (process.platform === 'darwin') {
  // For macOS
  targetDir = path.resolve(__dirname, '..', 'src-tauri', 'target', 'debug', 'bundle', 'macos', 'Exif Hound Pro.app', 'Contents', 'Resources');
} else {
  // For Linux
  targetDir = path.resolve(__dirname, '..', 'src-tauri', 'target', 'debug', 'resources');
}

// Make sure the target directory exists
if (!fs.existsSync(targetDir)) {
  try {
    console.log(`Creating target directory: ${targetDir}`);
    fs.mkdirSync(targetDir, { recursive: true });
  } catch (error) {
    console.error(`Error creating target directory: ${error.message}`);
    process.exit(1);
  }
}

// Create icons subdirectory in target
const resourcesTargetDir = path.join(targetDir, 'icons');
if (!fs.existsSync(resourcesTargetDir)) {
  try {
    console.log(`Creating icons directory: ${resourcesTargetDir}`);
    fs.mkdirSync(resourcesTargetDir, { recursive: true });
  } catch (error) {
    console.error(`Error creating icons directory: ${error.message}`);
    process.exit(1);
  }
}

console.log(`Copying icons from ${iconsSourceDir} to ${resourcesTargetDir}`);

// Read all files in the source directory
try {
  const iconFiles = fs.readdirSync(iconsSourceDir);
  
  if (iconFiles.length === 0) {
    console.warn('Warning: No icon files found in the source directory');
  }
  
  // Copy each icon file to the target directory
  let copiedCount = 0;
  for (const iconFile of iconFiles) {
    const sourcePath = path.join(iconsSourceDir, iconFile);
    const targetPath = path.join(resourcesTargetDir, iconFile);
    
    // Check if it's a file (not a directory)
    if (fs.statSync(sourcePath).isFile()) {
      try {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${iconFile}`);
        copiedCount++;
      } catch (error) {
        console.error(`Error copying ${iconFile}: ${error.message}`);
      }
    }
  }
  
  console.log(`Successfully copied ${copiedCount} icon files for development mode`);
} catch (error) {
  console.error(`Error reading source directory: ${error.message}`);
  process.exit(1);
} 