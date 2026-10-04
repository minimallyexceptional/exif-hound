#!/usr/bin/env node
/**
 * Validates a Tauri static update manifest (latest.json) before publication.
 *
 * Structural validation is the default and is fully offline: SemVer, RFC 3339
 * date, expected channel, target names, HTTPS-only URLs, non-empty
 * signatures, artifact naming cross-checks and (with raw text)
 * duplicate platform keys.
 *
 * Optional flags:
 *   --staging-dir DIR  additionally verify each referenced artifact exists
 *                      on disk with the exact expected name
 *   --check-urls       perform live HEAD requests against every artifact URL
 *                      (network-dependent; kept out of the default path to
 *                      avoid flaky CI)
 *
 * Usage:
 *   node scripts/updater/validate-update-manifest.mjs latest.json \
 *     --channel stable --version 2.7.0 \
 *     [--staging-dir ./staging] [--check-urls]
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  CHANNELS,
  RELEASED_TARGETS,
  ARTIFACT_PATTERNS,
  artifactFilename,
  validateManifest,
} from './manifest.mjs';
import { isValidSemver } from './semver.mjs';

function fail(messages) {
  fs.writeSync(
    process.stderr.fd,
    `${messages.map(message => `✖ ${message}`).join('\n')}\n`
  );
  process.exit(1);
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    channel: { type: 'string' },
    version: { type: 'string' },
    repo: { type: 'string' },
    tag: { type: 'string' },
    targets: { type: 'string' },
    'staging-dir': { type: 'string' },
    'check-urls': { type: 'boolean' },
  },
});

const file = positionals[0];
if (!file) fail(['usage: validate-update-manifest.mjs <latest.json> --channel <c> --version <v>']);

const channel = values.channel ?? 'stable';
const version = values.version;
if (!CHANNELS.includes(channel)) fail([`--channel must be one of: ${CHANNELS.join(', ')}`]);
if (!version || !isValidSemver(version)) fail([`--version must be valid SemVer, got: ${version}`]);

const targets = values.targets
  ? values.targets.split(',').map(t => t.trim()).filter(Boolean)
  : RELEASED_TARGETS;

let rawText;
let manifest;
try {
  rawText = fs.readFileSync(file, 'utf8');
  manifest = JSON.parse(rawText);
} catch (error) {
  fail([`cannot read/parse manifest ${file}: ${error.message}`]);
}

const result = validateManifest({
  manifest,
  rawText,
  channel,
  version,
  targets,
  repo: values.repo,
  tag: values.tag,
});

// Optional: verify the referenced artifacts exist locally.
if (values['staging-dir']) {
  const stagingDir = values['staging-dir'];
  for (const [target, entry] of Object.entries(manifest.platforms ?? {})) {
    const filename = artifactFilename(entry.url);
    if (!filename) {
      result.errors.push(`platform ${target} url does not contain a safe artifact filename`);
      continue;
    }
    const artifactPath = path.join(stagingDir, target, filename);
    if (!fs.existsSync(artifactPath)) {
      result.errors.push(`artifact missing from staging: ${artifactPath}`);
      continue;
    }
    const sigPath = `${artifactPath}.sig`;
    if (!fs.existsSync(sigPath) || fs.readFileSync(sigPath, 'utf8').trim().length === 0) {
      result.errors.push(`signature missing or empty in staging: ${sigPath}`);
    }
    if (!ARTIFACT_PATTERNS[target]?.test(filename)) {
      result.errors.push(`artifact in staging does not match target ${target}: ${filename}`);
    }
  }
}

// Optional live network validation, separate from structural checks.
if (values['check-urls']) {
  console.log('Performing live URL checks (--check-urls)…');
  for (const [target, entry] of Object.entries(manifest.platforms ?? {})) {
    try {
      const response = await fetch(entry.url, { method: 'HEAD' });
      if (!response.ok) {
        result.errors.push(`platform ${target} url responded ${response.status}`);
      }
    } catch (error) {
      result.errors.push(`platform ${target} url is unreachable: ${error.message}`);
    }
  }
}

if (!result.valid || result.errors.length > 0) fail(result.errors);

console.log(`✔ manifest ${file} is valid`);
console.log(`  channel: ${channel} · version: ${version}`);
console.log(`  platforms: ${Object.keys(manifest.platforms).join(', ')}`);
