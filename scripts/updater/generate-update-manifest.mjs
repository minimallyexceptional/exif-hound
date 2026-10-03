#!/usr/bin/env node
/**
 * Generates Tauri's static update manifest (latest.json) from the staged
 * release artifacts produced by the release workflow.
 *
 * Expected staging layout (one directory per platform target):
 *
 *   staging/
 *     darwin-aarch64/  Exif Hound.app.tar.gz (+ .sig, .dmg)
 *     windows-x86_64/  Exif Hound_2.7.0_x64-setup.exe (+ .sig, .msi)
 *     linux-x86_64/    Exif Hound_2.7.0_amd64.AppImage (+ .sig, .deb, .rpm)
 *
 * The manifest references GitHub Release download URLs — binaries are hosted
 * there while clients permanently trust updates.exifhound.com, so storage can
 * migrate without shipping a new client.
 *
 * Usage:
 *   node scripts/updater/generate-update-manifest.mjs \
 *     --channel stable --version 2.7.0 \
 *     --tag v2.7.0 --repo OWNER/NAME \
 *     --staging-dir ./staging --out ./latest.json \
 *     [--notes-file notes.md] [--notes "..."] [--pub-date RFC3339] \
 *     [--targets darwin-aarch64,windows-x86_64,linux-x86_64]
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  CHANNELS,
  RELEASED_TARGETS,
  ARTIFACT_PATTERNS,
  buildManifest,
  validateManifest,
} from './manifest.mjs';
import { isValidSemver } from './semver.mjs';

function fail(message) {
  fs.writeSync(process.stderr.fd, `\n✖ ${message}\n`);
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    channel: { type: 'string' },
    version: { type: 'string' },
    tag: { type: 'string' },
    repo: { type: 'string' },
    'staging-dir': { type: 'string' },
    out: { type: 'string' },
    notes: { type: 'string' },
    'notes-file': { type: 'string' },
    'pub-date': { type: 'string' },
    targets: { type: 'string' },
  },
});

const channel = values.channel ?? 'stable';
const version = values.version;
const tag = values.tag;
const repo = values.repo;
const stagingDir = values['staging-dir'];
const out = values.out ?? 'latest.json';

if (!CHANNELS.includes(channel)) fail(`--channel must be one of: ${CHANNELS.join(', ')}`);
if (!version || !isValidSemver(version)) fail(`--version must be valid SemVer, got: ${version}`);
if (!tag) fail('--tag is required');
if (!repo || !/^[^/]+\/[^/]+$/.test(repo)) fail('--repo must be OWNER/NAME');
if (!stagingDir) fail('--staging-dir is required');

const targets = values.targets
  ? values.targets.split(',').map(t => t.trim()).filter(Boolean)
  : RELEASED_TARGETS;
for (const target of targets) {
  if (!ARTIFACT_PATTERNS[target]) fail(`unsupported target: ${target}`);
}

let notes = values.notes ?? '';
if (values['notes-file']) {
  notes = fs.readFileSync(values['notes-file'], 'utf8').trim();
}
if (!notes) notes = 'See the release page for details.';

const pubDate = values['pub-date'] ?? new Date().toISOString();

const platforms = {};
for (const target of targets) {
  const dir = path.join(stagingDir, target);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    fail(`missing staging directory for target "${target}": ${dir}`);
  }

  const pattern = ARTIFACT_PATTERNS[target];
  const artifacts = fs
    .readdirSync(dir)
    .filter(name => pattern.test(name));
  if (artifacts.length === 0) {
    fail(`no updater artifact found in ${dir} (expected pattern ${pattern})`);
  }
  if (artifacts.length > 1) {
    fail(`ambiguous updater artifacts in ${dir}: ${artifacts.join(', ')}`);
  }
  const artifact = artifacts[0];

  const sigPath = path.join(dir, `${artifact}.sig`);
  if (!fs.existsSync(sigPath)) {
    fail(`missing updater signature for ${artifact}: ${sigPath} is absent`);
  }
  const signature = fs.readFileSync(sigPath, 'utf8').trim();
  if (!signature) {
    fail(`empty updater signature: ${sigPath}`);
  }

  const filename = encodeURIComponent(artifact);
  platforms[target] = {
    signature,
    url: `https://github.com/${repo}/releases/download/${tag}/${filename}`,
  };
}

const manifest = buildManifest({ version, notes, pubDate, platforms });

// Self-validate before writing — a bad manifest must never leave the script.
const rawText = JSON.stringify(manifest, null, 2);
const result = validateManifest({ manifest, rawText, channel, version, targets, repo, tag });
if (!result.valid) {
  fail(`generated manifest failed validation:\n  - ${result.errors.join('\n  - ')}`);
}

fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`✔ wrote ${out}`);
for (const target of targets) {
  console.log(`  ${target.padEnd(16)} ${platforms[target].url}`);
}
console.log(`  channel: ${channel} · version: ${version} · pub_date: ${pubDate}`);
