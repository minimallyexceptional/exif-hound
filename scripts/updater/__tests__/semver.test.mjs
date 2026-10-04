import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSemver, isValidSemver, isPrerelease, compareSemver } from '../semver.mjs';

test('parseSemver accepts valid versions', () => {
  const parsed = parseSemver('2.7.0');
  assert.deepEqual(
    { major: parsed.major, minor: parsed.minor, patch: parsed.patch, prerelease: parsed.prerelease },
    { major: 2, minor: 7, patch: 0, prerelease: [] }
  );

  const pre = parseSemver('2.7.0-test.1');
  assert.deepEqual(pre.prerelease, ['test', '1']);
});

test('parseSemver rejects garbage', () => {
  for (const bad of ['', '2.7', 'v2.7.0', '2.7.0.1', '02.7.0', '2.7.0-', null, undefined, 42]) {
    assert.equal(parseSemver(bad), null, `should reject: ${bad}`);
  }
});

test('isValidSemver', () => {
  assert.equal(isValidSemver('1.0.0'), true);
  assert.equal(isValidSemver('1.0.0-beta.1'), true);
  assert.equal(isValidSemver('1.0'), false);
});

test('isPrerelease', () => {
  assert.equal(isPrerelease('2.7.0'), false);
  assert.equal(isPrerelease('2.7.0-test.1'), true);
  assert.equal(isPrerelease('2.8.0-beta.1'), true);
});

test('compareSemver orders releases', () => {
  assert.ok(compareSemver('2.7.0', '2.6.9') > 0);
  assert.ok(compareSemver('2.7.0', '2.7.0') === 0);
  assert.ok(compareSemver('2.10.0', '2.9.0') > 0, 'numeric, not lexicographic');
  assert.ok(compareSemver('2.7.1', '2.7.0') > 0);
});

test('compareSemver applies prerelease precedence rules', () => {
  assert.ok(compareSemver('2.7.0', '2.7.0-test.1') > 0, 'release outranks prerelease');
  assert.ok(compareSemver('2.7.0-test.2', '2.7.0-test.1') > 0);
  assert.ok(compareSemver('2.7.0-alpha', '2.7.0-beta') < 0);
  assert.ok(compareSemver('2.7.0-1', '2.7.0-alpha') < 0, 'numeric < alphanumeric');
  assert.ok(compareSemver('2.7.0-test', '2.7.0-test.1') < 0, 'shorter prerelease is lower');
});