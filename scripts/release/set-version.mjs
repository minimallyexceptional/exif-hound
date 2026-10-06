#!/usr/bin/env node
/**
 * Synchronize the desktop app version to the authoritative source.
 *
 * `src-tauri/tauri.conf.json` is the single source of truth for the app
 * version: the release pipeline, bundles, installers, and updater manifests
 * all read it from there. Running this command updates the desktop
 * workspace `package.json` and the root `package-lock.json` to match,
 * so a release bump is a one-file edit followed by one command:
 *
 *   npm run release:version
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tauriConfigPath = path.join(repoRoot, 'apps/exif-hound-desktop/src-tauri/tauri.conf.json');
const packageJsonPath = path.join(repoRoot, 'apps/exif-hound-desktop/package.json');

const { version } = JSON.parse(readFileSync(tauriConfigPath, 'utf8'));
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`tauri.conf.json does not contain a valid semver version: ${JSON.stringify(version)}`);
  process.exit(1);
}

console.log(`Syncing workspace version to ${version} (from tauri.conf.json)`);

const packageJsonVersion = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
if (packageJsonVersion === version) {
  console.log('Already in sync — nothing to change.');
} else {
  execFileSync(
    'npm',
    ['version', version, '--workspace=exif-hound-desktop', '--no-git-tag-version'],
    { stdio: 'inherit', cwd: repoRoot },
  );
}
console.log('Done. desktop package.json and package-lock.json now match tauri.conf.json.');
