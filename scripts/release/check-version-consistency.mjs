#!/usr/bin/env node
/**
 * Fail the release before any platform build if the app version files disagree.
 *
 * `apps/exif-hound-desktop/src-tauri/tauri.conf.json` is the single source of
 * truth. The release workflow runs this in its prepare job so a version bump
 * that forgot `npm run release:version` is caught in seconds, not after the
 * build matrix completes. Exit codes: 0 = consistent, 1 = inconsistent.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tauriConfigPath = path.join(repoRoot, 'apps/exif-hound-desktop/src-tauri/tauri.conf.json');
const packageJsonPath = path.join(repoRoot, 'apps/exif-hound-desktop/package.json');
const packageLockPath = path.join(repoRoot, 'package-lock.json');

export function checkVersionConsistency({ tauriVersion, packageVersion, lockVersion }) {
  const mismatches = [];
  if (packageVersion !== tauriVersion) {
    mismatches.push(`apps/exif-hound-desktop/package.json (${packageVersion})`);
  }
  if (lockVersion !== tauriVersion) {
    mismatches.push(`package-lock.json workspace entry (${lockVersion})`);
  }
  if (mismatches.length === 0) return { ok: true, mismatches };
  return { ok: false, mismatches };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tauriVersion = JSON.parse(readFileSync(tauriConfigPath, 'utf8')).version;
  const packageVersion = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
  const lockVersion = JSON.parse(readFileSync(packageLockPath, 'utf8')).packages['apps/exif-hound-desktop'].version;

  const result = checkVersionConsistency({ tauriVersion, packageVersion, lockVersion });
  if (!result.ok) {
    console.error(`::error::App version files disagree with tauri.conf.json version ${tauriVersion}:`);
    for (const mismatch of result.mismatches) console.error(`::error::  - ${mismatch}`);
    console.error(`::error::Run \`npm run release:version\` and commit.`);
    process.exit(1);
  }
  console.log(`App version consistent across tauri.conf.json, package.json and package-lock.json: ${tauriVersion}`);
}
