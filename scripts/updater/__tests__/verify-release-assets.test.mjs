import { test } from 'node:test';
import assert from 'node:assert/strict';

import { verifyAssets, manifestUrlFilenames } from '../verify-release-assets.mjs';
import { validateManifest } from '../manifest.mjs';

test('manifest URLs matching stored assets pass', () => {
  const errors = verifyAssets({
    urlFilenames: ['Exif.Hound_2.6.2_x64-setup.exe', 'Exif.Hound_2.6.2_amd64.AppImage'],
    assetNames: ['Exif.Hound_2.6.2_x64-setup.exe', 'Exif.Hound_2.6.2_amd64.AppImage'],
  });
  assert.deepEqual(errors, []);
});

test('GitHub-renamed asset names fail loudly', () => {
  const errors = verifyAssets({
    urlFilenames: ['Exif Hound_2.6.2_x64-setup.exe'],
    assetNames: ['Exif.Hound_2.6.2_x64-setup.exe'],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /no release asset with that name exists/);
});

test('manifestUrlFilenames decodes every platform URL', () => {
  const manifest = {
    platforms: {
      'darwin-aarch64': { url: 'https://github.com/o/r/releases/download/v1/Exif%20Hound.app.tar.gz', signature: 's' },
      'linux-x86_64': { url: 'https://github.com/o/r/releases/download/v1/Exif.Hound_1_amd64.AppImage', signature: 's' },
    },
  };
  assert.deepEqual(manifestUrlFilenames(manifest), [
    'Exif Hound.app.tar.gz',
    'Exif.Hound_1_amd64.AppImage',
  ]);
});

test('manifest validator rejects space-containing artifact filenames', () => {
  const manifest = {
    version: '2.6.2',
    pub_date: '2026-10-06T15:00:00Z',
    platforms: {
      'windows-x86_64': {
        url: 'https://github.com/o/r/releases/download/v2.6.2/Exif%20Hound_2.6.2_x64-setup.exe',
        signature: 's',
      },
    },
  };
  const result = validateManifest({ manifest, channel: 'stable', version: '2.6.2' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => /contains a space, which GitHub renames/.test(error)));
});

test('manifest validator accepts GitHub-safe (dot) filenames', () => {
  const manifest = {
    version: '2.6.2',
    pub_date: '2026-10-06T15:00:00Z',
    platforms: {
      'windows-x86_64': {
        url: 'https://github.com/o/r/releases/download/v2.6.2/Exif.Hound_2.6.2_x64-setup.exe',
        signature: 's',
      },
    },
  };
  const result = validateManifest({ manifest, channel: 'stable', version: '2.6.2', targets: ['windows-x86_64'] });
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

// The CLI's release-fetch step runs for real on every release run, where
// GH_TOKEN is available; its logic is covered hermetically by the tests above.
