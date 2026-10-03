import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let staging;

beforeEach(() => {
  staging = fs.mkdtempSync(path.join(os.tmpdir(), 'exifhound-manifest-'));
  for (const target of ['darwin-aarch64', 'windows-x86_64', 'linux-x86_64']) {
    fs.mkdirSync(path.join(staging, target), { recursive: true });
  }
  fs.writeFileSync(path.join(staging, 'darwin-aarch64', 'Exif Hound Community.app.tar.gz'), 'mac-bytes');
  fs.writeFileSync(path.join(staging, 'darwin-aarch64', 'Exif Hound Community.app.tar.gz.sig'), 'SIG-MAC');
  fs.writeFileSync(path.join(staging, 'windows-x86_64', 'Exif Hound Community_2.7.0_x64-setup.exe'), 'win-bytes');
  fs.writeFileSync(path.join(staging, 'windows-x86_64', 'Exif Hound Community_2.7.0_x64-setup.exe.sig'), 'SIG-WIN');
  fs.writeFileSync(path.join(staging, 'linux-x86_64', 'Exif Hound Community_2.7.0_amd64.AppImage'), 'linux-bytes');
  fs.writeFileSync(path.join(staging, 'linux-x86_64', 'Exif Hound Community_2.7.0_amd64.AppImage.sig'), 'SIG-LINUX');
});

afterEach(() => {
  fs.rmSync(staging, { recursive: true, force: true });
});

function baseArgs() {
  return [
    '--edition', 'community',
    '--channel', 'stable',
    '--version', '2.7.0',
    '--tag', 'community-v2.7.0',
    '--repo', 'acme/exif-hound',
    '--staging-dir', staging,
    '--pub-date', '2026-10-12T18:00:00Z',
    '--notes', 'Improved map tools.',
  ];
}

function generate(extraArgs = []) {
  return execFileAsync(process.execPath, [
    path.join(SCRIPTS_DIR, 'generate-update-manifest.mjs'),
    ...baseArgs(),
    '--out', path.join(staging, 'latest.json'),
    ...extraArgs,
  ]);
}

function validateManifestCli(extraArgs = []) {
  return execFileAsync(process.execPath, [
    path.join(SCRIPTS_DIR, 'validate-update-manifest.mjs'),
    path.join(staging, 'latest.json'),
    '--edition', 'community',
    '--channel', 'stable',
    '--version', '2.7.0',
    '--repo', 'acme/exif-hound',
    '--tag', 'community-v2.7.0',
    '--staging-dir', staging,
    ...extraArgs,
  ]);
}

async function assertCliRejects(run, pattern) {
  try {
    await run();
    assert.fail('expected CLI command to fail');
  } catch (error) {
    // Newer Node versions no longer include child stderr in Error.message.
    // Assert against every diagnostic field so failures remain meaningful
    // across the Node versions used by developers and CI.
    const diagnostic = [error?.message, error?.stdout, error?.stderr]
      .filter(Boolean)
      .join('\n');
    assert.match(diagnostic, pattern);
  }
}

test('generate produces a valid manifest from staged artifacts; validate accepts it', async () => {
  await generate();
  const manifest = JSON.parse(fs.readFileSync(path.join(staging, 'latest.json'), 'utf8'));
  assert.equal(manifest.version, '2.7.0');
  assert.equal(manifest.notes, 'Improved map tools.');
  assert.equal(manifest.pub_date, '2026-10-12T18:00:00Z');
  assert.equal(
    manifest.platforms['darwin-aarch64'].url,
    'https://github.com/acme/exif-hound/releases/download/community-v2.7.0/Exif%20Hound%20Community.app.tar.gz'
  );
  assert.equal(manifest.platforms['darwin-aarch64'].signature, 'SIG-MAC');
  assert.equal(manifest.platforms['windows-x86_64'].signature, 'SIG-WIN');
  assert.equal(manifest.platforms['linux-x86_64'].signature, 'SIG-LINUX');

  await assert.doesNotReject(() => validateManifestCli());
});

test('generate fails when a signature is missing', async () => {
  fs.rmSync(path.join(staging, 'darwin-aarch64', 'Exif Hound Community.app.tar.gz.sig'));
  await assertCliRejects(() => generate(), /missing updater signature/);
});

test('generate fails when an artifact is missing for an expected target', async () => {
  fs.rmSync(path.join(staging, 'linux-x86_64'), { recursive: true });
  await assertCliRejects(() => generate(), /missing staging directory/);
});

test('generate fails when a platform dir has no recognizable updater artifact', async () => {
  fs.rmSync(path.join(staging, 'windows-x86_64', 'Exif Hound Community_2.7.0_x64-setup.exe'));
  await assertCliRejects(() => generate(), /no updater artifact found/);
});

test('generated manifest is rejected when a staged artifact is removed afterwards', async () => {
  await generate();
  fs.rmSync(path.join(staging, 'linux-x86_64', 'Exif Hound Community_2.7.0_amd64.AppImage'));
  await assertCliRejects(() => validateManifestCli(), /artifact missing from staging/);
});

test('generated manifest is rejected when a signature file is emptied afterwards', async () => {
  await generate();
  fs.writeFileSync(path.join(staging, 'linux-x86_64', 'Exif Hound Community_2.7.0_amd64.AppImage.sig'), '');
  await assertCliRejects(() => validateManifestCli(), /signature missing or empty/);
});

test('validate rejects a pro artifact inside a community manifest', async () => {
  await generate();
  const file = path.join(staging, 'latest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.platforms['darwin-aarch64'].url =
    'https://github.com/acme/exif-hound/releases/download/community-v2.7.0/Exif%20Hound%20Pro.app.tar.gz';
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
  await assertCliRejects(() => validateManifestCli(), /edition "community"/);
});

test('validate rejects a manifest whose version does not match --version', async () => {
  await generate();
  const file = path.join(staging, 'latest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.version = '9.9.9';
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
  await assertCliRejects(
    () =>
      execFileAsync(process.execPath, [
        path.join(SCRIPTS_DIR, 'validate-update-manifest.mjs'),
        file,
        '--edition', 'community',
        '--channel', 'stable',
        '--version', '2.7.0',
      ]),
    /does not match release version/
  );
});

test('validate rejects http:// URLs', async () => {
  await generate();
  const file = path.join(staging, 'latest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.platforms['darwin-aarch64'].url = manifest.platforms['darwin-aarch64'].url.replace('https://', 'http://');
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
  await assertCliRejects(() => validateManifestCli(), /HTTPS/);
});
