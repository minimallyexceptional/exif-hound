import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildManifest,
  validateManifest,
  artifactMatchesApp,
  feedUrl,
  RELEASED_TARGETS,
} from '../manifest.mjs';

const GOOD_SIGNATURE = 'dW5zaWduZWQgY29tbWVudA==';

function goodManifest(overrides = {}) {
  const platforms = {
    'darwin-aarch64': {
      signature: GOOD_SIGNATURE,
      url: 'https://github.com/acme/exif-hound/releases/download/v2.7.0/Exif%20Hound.app.tar.gz',
    },
    'windows-x86_64': {
      signature: GOOD_SIGNATURE,
      url: 'https://github.com/acme/exif-hound/releases/download/v2.7.0/Exif%20Hound_2.7.0_x64-setup.exe',
    },
    'linux-x86_64': {
      signature: GOOD_SIGNATURE,
      url: 'https://github.com/acme/exif-hound/releases/download/v2.7.0/Exif%20Hound_2.7.0_amd64.AppImage',
    },
    ...overrides.platforms,
  };
  return {
    version: '2.7.0',
    notes: 'Improved map tools and Linux compatibility.',
    pub_date: '2026-10-12T18:00:00Z',
    platforms,
    ...overrides.top,
  };
}

function validate(manifest, overrides = {}) {
  return validateManifest({
    manifest,
    rawText: JSON.stringify(manifest),
    channel: 'stable',
    version: '2.7.0',
    repo: 'acme/exif-hound',
    tag: 'v2.7.0',
    ...overrides,
  });
}

test('feedUrl separates update channels', () => {
  assert.equal(feedUrl('stable'), 'https://updates.exifhound.com/stable/latest.json');
  assert.equal(feedUrl('internal'), 'https://updates.exifhound.com/internal/latest.json');
  assert.notEqual(feedUrl('stable'), feedUrl('internal'));
});

test('artifactMatchesApp accepts consolidated names and rejects legacy editions', () => {
  assert.equal(artifactMatchesApp('Exif Hound.app.tar.gz'), true);
  assert.equal(artifactMatchesApp('Exif Hound_2.7.0_x64-setup.exe'), true);
  assert.equal(artifactMatchesApp('exif-hound_2.7.0_amd64.AppImage'), true);
  assert.equal(artifactMatchesApp('Exif Hound Community.app.tar.gz'), false);
  assert.equal(artifactMatchesApp('Exif Hound Pro_2.7.0_amd64.AppImage'), false);
  assert.equal(artifactMatchesApp('Another App.app.tar.gz'), false);
});

test('a well-formed consolidated manifest validates', () => {
  assert.deepEqual(validate(goodManifest()), { valid: true, errors: [] });
});

test('buildManifest omits empty notes', () => {
  const manifest = buildManifest({
    version: '2.7.0',
    notes: '',
    pubDate: '2026-10-12T18:00:00Z',
    platforms: {},
  });
  assert.equal('notes' in manifest, false);
});

test('rejects non-HTTPS artifact URLs', () => {
  const manifest = goodManifest();
  manifest.platforms['darwin-aarch64'].url = manifest.platforms['darwin-aarch64'].url.replace('https://', 'http://');
  const result = validate(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('HTTPS')));
});

test('rejects encoded path separators in artifact filenames', () => {
  const manifest = goodManifest();
  manifest.platforms['linux-x86_64'].url =
    'https://github.com/acme/exif-hound/releases/download/v2.7.0/%2E%2E%2FExif%20Hound_2.7.0_amd64.AppImage';
  const result = validate(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('safe artifact filename')));
});

test('rejects empty signatures', () => {
  const manifest = goodManifest();
  manifest.platforms['linux-x86_64'].signature = '   ';
  const result = validate(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('linux-x86_64') && error.includes('signature')));
});

test('rejects legacy edition artifacts', () => {
  const manifest = goodManifest({
    platforms: {
      'darwin-aarch64': {
        signature: GOOD_SIGNATURE,
        url: 'https://github.com/acme/exif-hound/releases/download/v2.7.0/Exif%20Hound%20Pro.app.tar.gz',
      },
    },
  });
  const result = validate(manifest, { targets: ['darwin-aarch64'] });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('consolidated Exif Hound app')));
});

test('rejects manifest version that does not match the release version', () => {
  const result = validate(goodManifest({ top: { version: '2.7.1' } }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('does not match release version')));
});

test('rejects invalid SemVer', () => {
  const result = validate(goodManifest({ top: { version: 'not-a-version' } }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('SemVer')));
});

test('rejects prerelease versions in stable manifests', () => {
  const manifest = goodManifest();
  manifest.version = '2.7.0-test.1';
  const result = validate(manifest, { version: '2.7.0-test.1' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('prerelease')));
});

test('allows prerelease versions in internal manifests', () => {
  const manifest = goodManifest();
  manifest.version = '2.7.0-test.2';
  for (const entry of Object.values(manifest.platforms)) {
    entry.url = entry.url.replace('v2.7.0', 'internal-v2.7.0-test.2');
  }
  const result = validate(manifest, {
    version: '2.7.0-test.2',
    channel: 'internal',
    tag: 'internal-v2.7.0-test.2',
  });
  assert.equal(result.valid, true);
});

test('rejects malformed pub_date', () => {
  const result = validate(goodManifest({ top: { pub_date: 'yesterday' } }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('pub_date')));
});

test('rejects unknown platform targets', () => {
  const manifest = goodManifest();
  manifest.platforms['atari-8bit'] = { signature: GOOD_SIGNATURE, url: 'https://example.com/x' };
  const result = validate(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('unknown platform target')));
});

test('rejects missing expected targets', () => {
  const manifest = goodManifest();
  delete manifest.platforms['windows-x86_64'];
  const result = validate(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('missing: windows-x86_64')));
});

test('detects duplicate platform keys in the raw JSON text', () => {
  const rawText = `{
    "version": "2.7.0",
    "pub_date": "2026-10-12T18:00:00Z",
    "platforms": {
      "darwin-aarch64": { "signature": "a", "url": "https://x/Exif%20Hound.app.tar.gz" },
      "darwin-aarch64": { "signature": "b", "url": "https://y/Exif%20Hound.app.tar.gz" }
    }
  }`;
  const result = validateManifest({
    manifest: JSON.parse(rawText),
    rawText,
    channel: 'stable',
    version: '2.7.0',
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('duplicate platform entry') && error.includes('darwin-aarch64')));
});

test('rejects URLs pointing at the wrong tag or repo', () => {
  const manifest = goodManifest();
  manifest.platforms['darwin-aarch64'].url = manifest.platforms['darwin-aarch64'].url.replace(
    'v2.7.0',
    'v2.7.1'
  );
  const result = validate(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('does not point at release')));
});

test('RELEASED_TARGETS matches what the pipeline actually builds', () => {
  assert.deepEqual(RELEASED_TARGETS, ['darwin-aarch64', 'windows-x86_64', 'linux-x86_64']);
});
