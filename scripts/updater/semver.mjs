/**
 * Minimal SemVer parsing/comparison for the update manifest tooling.
 * Deliberately dependency-free so release tooling runs on plain Node.
 */

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Parses a SemVer string. Returns null when invalid.
 */
export function parseSemver(version) {
  if (typeof version !== 'string') return null;
  const match = SEMVER_PATTERN.exec(version.trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
    build: match[5] ? match[5].split('.') : [],
    raw: version.trim(),
  };
}

export function isValidSemver(version) {
  return parseSemver(version) !== null;
}

export function isPrerelease(version) {
  const parsed = parseSemver(version);
  return parsed !== null && parsed.prerelease.length > 0;
}

/**
 * SemVer precedence comparison. Returns negative when a < b, 0 when equal,
 * positive when a > b (including prerelease rules per semver.org §11).
 */
export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) throw new Error(`invalid semver: ${!pa ? a : b}`);
  for (const key of ['major', 'minor', 'patch']) {
    if (pa[key] !== pb[key]) return pa[key] - pb[key];
  }
  const preA = pa.prerelease;
  const preB = pb.prerelease;
  if (preA.length === 0 && preB.length === 0) return 0;
  // A release outranks any prerelease of the same triple.
  if (preA.length === 0) return 1;
  if (preB.length === 0) return -1;
  const len = Math.max(preA.length, preB.length);
  for (let i = 0; i < len; i++) {
    const x = preA[i];
    const y = preB[i];
    if (x === undefined) return -1; // shorter prerelease is lower precedence
    if (y === undefined) return 1;
    if (x === y) continue;
    const nx = Number(x);
    const ny = Number(y);
    const bothNumeric = !Number.isNaN(nx) && !Number.isNaN(ny);
    if (bothNumeric) return nx - ny;
    if (!Number.isNaN(nx)) return -1; // numeric identifiers are lower than alphanumeric
    if (!Number.isNaN(ny)) return 1;
    return x < y ? -1 : x > y ? 1 : 0;
  }
  return 0;
}