#!/usr/bin/env node
/**
 * Shared release build driver for the Exif Hound desktop app.
 *
 * Usage (via the thin wrappers):
 *   node scripts/build-pro.mjs        # build the PRO edition release
 *   node scripts/build-community.mjs  # build the COMMUNITY edition release
 *
 * Optional overrides:
 *   EDITION=pro|community      edition (set automatically by the wrappers)
 *   TAURI_TARGET=<rust triple> override the Tauri --target triple
 *   TAURI_BUNDLES=<targets>    override bundle targets (e.g. "dmg app" or "nsis")
 *
 * Release targets (built from matching host hardware — Tauri cannot
 * cross-compile across OSes, run this script on each platform, e.g. in CI):
 *   - macOS:  aarch64-apple-darwin   (Apple Silicon only, no Intel/universal)
 *   - Linux:  x86_64-unknown-linux-gnu
 *   - Windows: x86_64-pc-windows-msvc
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = path.join(ROOT, 'apps', 'exif-hound-desktop');

// Target triples for "current hardware" on each OS
const TARGETS = {
  darwin: 'aarch64-apple-darwin', // Apple Silicon (M1/M2/M3/M4) — not Intel
  linux: 'x86_64-unknown-linux-gnu',
  win32: 'x86_64-pc-windows-msvc',
};

const TAURI_CONFIGS = {
  community: 'src-tauri/tauri.community.conf.json',
};

function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

export function buildEdition(edition) {
  if (edition !== 'pro' && edition !== 'community') {
    fail(`Unknown edition "${edition}" — expected "pro" or "community"`);
  }

  const target = process.env.TAURI_TARGET || TARGETS[process.platform];
  if (!target) {
    fail(`Unsupported platform "${process.platform}" for release builds`);
  }

  const args = ['build', '--target', target];
  const tauriConfig = TAURI_CONFIGS[edition];
  if (tauriConfig) {
    args.push('--config', tauriConfig);
  }
  if (process.env.TAURI_BUNDLES) {
    args.push('--bundles', process.env.TAURI_BUNDLES);
  }

  console.log(`\n▶ Building ${edition.toUpperCase()} edition`);
  console.log(`  platform:  ${process.platform}`);
  console.log(`  target:    ${target}`);
  console.log(`  config:    ${tauriConfig ?? 'src-tauri/tauri.conf.json (default)'}\n`);

  const result = spawnSync('npm', ['run', 'tauri', '--', ...args], {
    cwd: APP_DIR,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      EDITION: edition,
    },
  });

  if (result.status !== 0) {
    fail(`${edition} build failed (exit code ${result.status})`);
  }

  console.log(`\n✔ ${edition.toUpperCase()} build complete`);
  console.log(`  Bundles are in apps/exif-hound-desktop/src-tauri/target/${target}/release/bundle/`);
}

// Allow running either as a wrapper import or directly:
//   node scripts/build.mjs pro|community
if (process.argv[1] && path.basename(process.argv[1]) === 'build.mjs') {
  const edition = process.argv[2];
  if (!edition) fail('Usage: node scripts/build.mjs <pro|community>');
  buildEdition(edition);
}