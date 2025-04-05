/**
 * This script prepares the development environment for Tauri
 * by ensuring the required directories exist.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the required directories for Tauri dev mode
const targetDebugDir = path.resolve(__dirname, '..', 'src-tauri', 'target', 'debug');
const resourcesDir = path.join(targetDebugDir, 'resources');
const iconsDir = path.join(resourcesDir, 'icons');

const directories = [targetDebugDir, resourcesDir, iconsDir];

// Create all directories
for (const dir of directories) {
  if (!fs.existsSync(dir)) {
    try {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
}

console.log('Development environment prepared successfully'); 