/**
 * Update manifest domain logic shared by the generator and validator CLIs.
 *
 * The manifest is Tauri's static JSON update manifest:
 *
 *   {
 *     "version": "2.7.0",
 *     "notes": "...",
 *     "pub_date": "2026-10-12T18:00:00Z",
 *     "platforms": {
 *       "darwin-aarch64": { "url": "...", "signature": "..." }
 *     }
 *   }
 *
 * Artifact names are checked against the consolidated "Exif Hound" product
 * name. Legacy Community/Pro artifacts are rejected so an old edition build
 * cannot accidentally enter the single-app update feed.
 */

import { isValidSemver, isPrerelease } from './semver.mjs';

export const CHANNELS = ['stable', 'beta', 'internal'];

/** Targets the updater schema can express (superset). */
export const SUPPORTED_TARGETS = [
  'darwin-aarch64',
  'darwin-x86_64',
  'windows-x86_64',
  'windows-arm64',
  'linux-x86_64',
  'linux-aarch64',
];

/** Targets the release pipeline actually builds today. */
export const RELEASED_TARGETS = ['darwin-aarch64', 'windows-x86_64', 'linux-x86_64', 'linux-aarch64'];

export function feedUrl(channel) {
  return `https://minimallyexceptional.github.io/exif-hound/${channel}/latest.json`;
}

const APP_NAME_PATTERN = /exif[ ._-]?hound/i;
const LEGACY_EDITION_PATTERN = /exif[ ._-]?hound[ ._-]?(?:community|pro)(?![a-z])/i;

/**
 * Normalizes artifact names so the app matcher recognizes both the staged
 * product name ("Exif Hound") and GitHub's sanitized release asset name
 * ("Exif.Hound"), plus legacy separators.
 */
export function normalizeArtifactName(filename) {
  return String(filename).replace(/\.Hound/gi, ' Hound');
}

/** True when the artifact belongs to the consolidated Exif Hound app. */
export function artifactMatchesApp(filename) {
  const normalized = normalizeArtifactName(filename);
  return APP_NAME_PATTERN.test(normalized) && !LEGACY_EDITION_PATTERN.test(normalized);
}

/** Safely extracts one artifact filename from a manifest URL. */
export function artifactFilename(url) {
  if (typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    const encoded = parsed.pathname.split('/').pop() ?? '';
    const filename = decodeURIComponent(encoded);
    // Encoded separators could otherwise escape a staging target directory
    // when the validator maps a URL back to a local artifact.
    if (!filename || filename.includes('/') || filename.includes('\\')) return null;
    return filename;
  } catch {
    return null;
  }
}

/** Updater artifact filename pattern per target (what createUpdaterArtifacts emits). */
export const ARTIFACT_PATTERNS = {
  'darwin-aarch64': /\.app\.tar\.gz$/,
  'darwin-x86_64': /\.app\.tar\.gz$/,
  'windows-x86_64': /-setup\.exe$/,
  'windows-arm64': /-setup\.exe$/,
  'linux-x86_64': /\.AppImage$/,
  'linux-aarch64': /\.AppImage$/,
};

/** RFC 3339 date-time (what Tauri's `pub_date` expects). */
const RFC3339_PATTERN = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})$/;

export function buildManifest({ version, notes, pubDate, platforms }) {
  const manifest = {
    version,
    notes: notes ?? '',
    pub_date: pubDate,
    platforms,
  };
  if (!manifest.notes) delete manifest.notes;
  return manifest;
}

/**
 * Validates a manifest structurally and against release expectations.
 * Pure: no network, no filesystem. Returns { valid, errors }.
 *
 * options:
 *   manifest       parsed manifest object
 *   rawText        optional raw manifest text, for duplicate-key detection
 *   channel        expected channel ('stable' | 'beta' | 'internal')
 *   version        expected release version (must equal manifest.version)
 *   targets        expected platform target keys (default RELEASED_TARGETS)
 *   repo           optional 'owner/name'; URL host/path is then checked
 *   tag            optional release tag; URL path is then checked
 */
export function validateManifest(options) {
  const {
    manifest,
    rawText,
    channel,
    version,
    targets = RELEASED_TARGETS,
    repo,
    tag,
  } = options;
  const errors = [];

  const add = (message) => errors.push(message);

  // ---- top-level shape
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { valid: false, errors: ['manifest is not a JSON object'] };
  }

  // ---- version
  if (!isValidSemver(manifest.version)) {
    add(`manifest.version is not valid SemVer: ${JSON.stringify(manifest.version)}`);
  } else if (version && manifest.version !== version) {
    add(`manifest.version (${manifest.version}) does not match release version (${version})`);
  }

  // ---- channel/version policy
  if (channel === 'stable' && isPrerelease(manifest.version)) {
    add('stable manifests must not reference prerelease versions');
  }
  if (channel !== 'internal' && /(?:test|internal)/i.test(String(manifest.version))) {
    add('production manifests must not reference internal/test builds');
  }

  // ---- pub_date
  if (typeof manifest.pub_date !== 'string' || !RFC3339_PATTERN.test(manifest.pub_date)) {
    add(`manifest.pub_date is not RFC 3339: ${JSON.stringify(manifest.pub_date)}`);
  } else if (Number.isNaN(Date.parse(manifest.pub_date))) {
    add('manifest.pub_date is not a parseable date');
  }

  // ---- notes (optional)
  if (manifest.notes !== undefined && typeof manifest.notes !== 'string') {
    add('manifest.notes must be a string when present');
  }

  // ---- platforms
  const platforms = manifest.platforms;
  if (!platforms || typeof platforms !== 'object' || Array.isArray(platforms)) {
    add('manifest.platforms is missing or not an object');
    return { valid: errors.length === 0, errors };
  }

  const keys = Object.keys(platforms);
  if (keys.length === 0) add('manifest.platforms is empty');

  // Duplicate keys collapse silently in JSON.parse; check the raw text.
  if (typeof rawText === 'string') {
    const seen = new Set();
    for (const target of SUPPORTED_TARGETS) {
      const occurrences = rawText.split(`"${target}"`).length - 1;
      if (occurrences > 1) {
        seen.add(target);
      }
    }
    for (const target of seen) {
      add(`duplicate platform entry in manifest: ${target}`);
    }
  }

  for (const target of keys) {
    if (!SUPPORTED_TARGETS.includes(target)) {
      add(`unknown platform target: ${target}`);
      continue;
    }
    const entry = platforms[target];
    if (!entry || typeof entry !== 'object') {
      add(`platform ${target} entry is missing or malformed`);
      continue;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(entry.url);
    } catch {
      parsedUrl = null;
    }

    if (!parsedUrl || parsedUrl.protocol !== 'https:') {
      add(`platform ${target} url must be an HTTPS URL`);
    } else if (repo && tag) {
      const expected = new URL(`https://github.com/${repo}/releases/download/${tag}/`);
      if (
        parsedUrl.origin !== expected.origin ||
        !parsedUrl.pathname.startsWith(expected.pathname)
      ) {
        add(`platform ${target} url does not point at release ${tag} of ${repo}`);
      }
    }

    if (typeof entry.signature !== 'string' || entry.signature.trim().length === 0) {
      add(`platform ${target} signature is missing or empty`);
    }

    if (typeof entry.url === 'string') {
      const filename = artifactFilename(entry.url);
      if (!filename) {
        add(`platform ${target} url does not contain a safe artifact filename`);
        continue;
      }
      if (filename.includes(' ')) {
        // GitHub replaces spaces in release asset names with dots at upload
        // time. A space in the manifest URL therefore 404s: the stored asset
        // name never matches the URL. Stage GitHub-safe names (dots) before
        // manifest generation and upload instead.
        add(`platform ${target} artifact filename contains a space, which GitHub renames at upload time (use GitHub-safe names, e.g. dots): ${filename}`);
      }
      if (!ARTIFACT_PATTERNS[target]?.test(filename)) {
        add(`platform ${target} artifact does not match the expected updater artifact naming: ${filename}`);
      }
      if (!artifactMatchesApp(filename)) {
        add(`platform ${target} artifact does not belong to the consolidated Exif Hound app: ${filename}`);
      }
    }
  }

  // ---- expected targets present
  for (const target of targets) {
    if (!keys.includes(target)) {
      add(`expected platform target is missing: ${target}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
