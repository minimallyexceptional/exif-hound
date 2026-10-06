#!/usr/bin/env node
/**
 * Verify that every artifact URL in a generated manifest matches an asset
 * name actually stored on the GitHub Release.
 *
 * GitHub sanitizes release asset names at upload time (spaces become dots).
 * A manifest URL built from a pre-sanitization staged name silently 404s
 * for every updater client while validation passes against the staging
 * directory. This check runs against the release as GitHub stores it, after
 * upload and before the draft release is published, so a mismatch aborts
 * publication loudly.
 *
 * Usage:
 *   node scripts/updater/verify-release-assets.mjs latest.json \
 *     --repo OWNER/NAME --tag v2.7.0
 *
 * Requires GH_TOKEN in the environment (set by the release workflow).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { artifactFilename } from './manifest.mjs';

/** Pure check: manifest URL filenames vs stored asset names. */
export function verifyAssets({ urlFilenames, assetNames }) {
  const assets = new Set(assetNames);
  const errors = [];
  for (const filename of urlFilenames) {
    if (!assets.has(filename)) {
      errors.push(
        `manifest references "${filename}" but no release asset with that name exists ` +
        `(GitHub may have renamed it; stored names: ${assetNames.join(', ')})`,
      );
    }
  }
  return errors;
}

/** Extracts decoded filenames from every platform URL in a manifest. */
export function manifestUrlFilenames(manifest) {
  return Object.values(manifest.platforms ?? {})
    .map(entry => artifactFilename(entry?.url))
    .filter(Boolean);
}

function runCli() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      repo: { type: 'string' },
      tag: { type: 'string' },
    },
  });
  const file = positionals[0];
  if (!file || !values.repo || !values.tag) {
    console.error('usage: verify-release-assets.mjs <latest.json> --repo OWNER/NAME --tag v<version>');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const urlFilenames = manifestUrlFilenames(manifest);
  if (urlFilenames.length === 0) {
    console.error('manifest has no platform URLs to verify');
    process.exit(1);
  }

  const output = execFileSync('gh', [
    'release', 'view', values.tag, '--repo', values.repo,
    '--json', 'assets', '--jq', '[.assets[].name] | join("\\n")',
  ], { encoding: 'utf8' });
  const assetNames = output.split('\n').map(name => name.trim()).filter(Boolean);

  const errors = verifyAssets({ urlFilenames, assetNames });
  if (errors.length > 0) {
    for (const error of errors) console.error(`::error::${error}`);
    process.exit(1);
  }
  console.log(`✔ all ${urlFilenames.length} manifest URLs match stored release assets for ${values.tag}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
