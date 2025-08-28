#!/usr/bin/env node
/*
 Cross-platform Electron artifact scan.
 Exits with code 1 if any Electron-specific references are found
 outside ignored directories.
*/

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const ignoreDirs = new Set([
  'node_modules',
  '.git',
  '.turbo',
  'coverage',
  'dist',
  'build',
  'out',
  '.next',
  'target',
]);

// Patterns indicating Electron usage
const patterns = [
  /(from\s+['\"]electron['\"])/i,
  /(require\(\s*['\"]electron['\"]\s*\))/i,
  /\bicp(?:Renderer|Main)\b/,
  /\bBrowserWindow\b/,
  /\bcontextBridge\b/,
  /\bprocess\.versions\.electron\b/,
  /\bnativeTheme\b/,
  // Removed generic Menu/Tray to avoid false positives in UI code
  /\bnodeIntegration\b/,
];

/** @param {string} file */
function shouldScanFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (!ext || ext === '.map' || ext === '.lock') return false;
  // Only scan common text/code files (skip markdown to avoid false positives in docs)
  return ['.js', '.jsx', '.ts', '.tsx', '.json', '.cjs', '.mjs', '.yml', '.yaml', '.html', '.css']
    .includes(ext);
}

/** Recursively list files */
function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    // Skip ignored directories
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      yield* walk(path.join(dir, entry.name));
    } else if (entry.isFile()) {
      const full = path.join(dir, entry.name);
      if (shouldScanFile(full)) yield full;
    }
  }
}

let found = [];
for (const file of walk(repoRoot)) {
  // Skip scanning electron artifacts directory names if any remain
  if (/[/\\](electron|dist-electron)[/\\]/.test(file)) continue;
  try {
    const content = fs.readFileSync(file, 'utf8');
    for (const rx of patterns) {
      if (rx.test(content)) {
        found.push({ file, pattern: rx.source });
        break;
      }
    }
  } catch {}
}

if (found.length > 0) {
  console.error('\nElectron references detected:');
  for (const f of found) {
    console.error(` - ${f.file}  (matched: /${f.pattern}/)`);
  }
  process.exit(1);
} else {
  console.log('No Electron references found.');
}


