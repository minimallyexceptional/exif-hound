import { test } from 'node:test';
import assert from 'node:assert/strict';

import { checkVersionConsistency } from '../check-version-consistency.mjs';

test('consistent versions pass', () => {
  const result = checkVersionConsistency({
    tauriVersion: '2.6.1',
    packageVersion: '2.6.1',
    lockVersion: '2.6.1',
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.mismatches, []);
});

test('package.json drift is reported', () => {
  const result = checkVersionConsistency({
    tauriVersion: '2.6.2',
    packageVersion: '2.6.1',
    lockVersion: '2.6.2',
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.mismatches, ['apps/exif-hound-desktop/package.json (2.6.1)']);
});

test('lockfile drift is reported', () => {
  const result = checkVersionConsistency({
    tauriVersion: '2.6.2',
    packageVersion: '2.6.2',
    lockVersion: '2.6.1',
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.mismatches, ['package-lock.json workspace entry (2.6.1)']);
});

test('multiple drifts are all reported', () => {
  const result = checkVersionConsistency({
    tauriVersion: '2.6.2',
    packageVersion: '2.6.1',
    lockVersion: '2.6.1',
  });
  assert.equal(result.ok, false);
  assert.equal(result.mismatches.length, 2);
});
