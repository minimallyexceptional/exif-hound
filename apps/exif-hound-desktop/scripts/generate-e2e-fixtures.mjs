#!/usr/bin/env node
/**
 * Generates deterministic binary E2E fixtures for the Playwright suite.
 *
 * Requires ImageMagick (`magick`) on PATH to create the base JPEG pixels; the
 * EXIF metadata is injected by this script itself (this ImageMagick build
 * cannot write EXIF APP1 segments), using a minimal TIFF/EXIF writer with no
 * dependencies.
 *
 * Run from the workspace root:
 *   node scripts/generate-e2e-fixtures.mjs
 *
 * Output (all values are constants asserted by the specs — see
 * playwright/fixtures/images/README.md):
 *   playwright/fixtures/images/full-exif.jpg   GPS + camera + exposure metadata
 *   playwright/fixtures/images/no-gps.jpg      camera metadata, no GPS
 *   playwright/fixtures/images/corrupt.jpg     deterministic pseudo-random bytes
 *   playwright/fixtures/import/points.kml      valid KML with two placemarks
 *   playwright/fixtures/import/invalid.txt     text that is not KML/CSV data
 *
 * The script verifies its own output with exifreader at the end and fails
 * loudly if the embedded values do not match.
 */

import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = join(dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = join(workspace, 'playwright/fixtures/images');
const importDir = join(workspace, 'playwright/fixtures/import');
mkdirSync(imgDir, { recursive: true });
mkdirSync(importDir, { recursive: true });

// ---------------------------------------------------------------------------
// Expected constants (single source of truth; documented in fixtures README)
// ---------------------------------------------------------------------------
export const FIXTURE_CONSTANTS = {
  make: 'TestCam',
  model: 'Hound-1',
  dateTimeOriginal: '2024:06:15 10:30:00', // EXIF format
  exposureTime: '1/250',
  fNumber: 8,
  iso: 200,
  focalLength: 35,
  gps: { latitude: 51.5, longitude: -(7 / 60 + 40 / 3600) }, // 51°30'0"N 0°7'40"W
};

// ---------------------------------------------------------------------------
// Minimal EXIF APP1 writer
// ---------------------------------------------------------------------------
const ASCII = 2, SHORT = 3, LONG = 4, RATIONAL = 5;
const TYPE_SIZE = { [ASCII]: 1, [SHORT]: 2, [LONG]: 4, [RATIONAL]: 8 };
const TAG_MAKE = 0x010f, TAG_MODEL = 0x0110;
const TAG_EXIF_IFD = 0x8769, TAG_GPS_IFD = 0x8825;

/**
 * Build a little-endian TIFF blob containing IFD0 plus optional Exif and GPS
 * sub-IFDs. entries: { ifd: 'ifd0'|'exif'|'gps', tag, type, values }
 * where values is a string (ASCII, NUL-terminated) or number[] (SHORT/LONG)
 * or {n,d}[] (RATIONAL).
 *
 * `embeddedThumbnail` appends a raw JPEG blob to the end of the TIFF data
 * area and records its absolute offset/length in the provided pointer/length
 * entry objects (tags 0x0201/0x0202), so IFD0 references the thumbnail.
 */
function buildTiff(entries, embeddedThumbnail) {
  const groups = { ifd0: [], exif: [], gps: [], ifd1: [] };
  for (const e of entries) groups[e.ifd].push(e);
  const sizeOfValue = (e) =>
    (typeof e.values === 'string' ? e.values.length + 1 : e.values.length) *
    TYPE_SIZE[e.type];
  const ifdSize = (g) => 2 + g.length * 12 + 4;

  const hasExif = groups.exif.length > 0;
  const hasGps = groups.gps.length > 0;
  const hasIfd1 = groups.ifd1.length > 0;

  // Layout: header(8) | IFD0 | ExifIFD | GPSIFD | IFD1 | value data.
  // IFD1 (the "1st IFD") is the classic TIFF thumbnail IFD that exifreader
  // resolves via IFD0's next-IFD pointer.
  const HEADER = 8;
  const ifd0EntryCount = groups.ifd0.length + (hasExif ? 1 : 0) + (hasGps ? 1 : 0);
  const exifOffset = HEADER + (2 + ifd0EntryCount * 12 + 4);
  const gpsOffset = exifOffset + (hasExif ? ifdSize(groups.exif) : 0);
  const ifd1Offset = gpsOffset + (hasGps ? ifdSize(groups.gps) : 0);
  let dataOffset = ifd1Offset + (hasIfd1 ? ifdSize(groups.ifd1) : 0);

  // Assign data-area offsets for values that don't fit in the 4-byte field.
  const large = [...groups.ifd0, ...groups.exif, ...groups.gps, ...groups.ifd1].filter(
    (e) => sizeOfValue(e) > 4
  );
  const valueBytes = new Map(); // entry -> Buffer
  for (const e of large) {
    const buf =
      typeof e.values === 'string'
        ? Buffer.from(e.values + '\0', 'latin1')
        : packScalars(e.values, e.type);
    valueBytes.set(e, buf);
    e.dataOffset = dataOffset;
    dataOffset += buf.length;
  }

  // Reserve space for the embedded thumbnail blob at the very end, then
  // point the IFD0 JPEGInterchangeFormat tags at it.
  let thumbnailOffset;
  if (embeddedThumbnail) {
    thumbnailOffset = dataOffset;
    dataOffset += embeddedThumbnail.blob.length;
    const offsetEntry = entries.find((e) => e.tag === 0x0201);
    const lengthEntry = entries.find((e) => e.tag === 0x0202);
    if (!offsetEntry || !lengthEntry) {
      throw new Error('embeddedThumbnail requires 0x0201/0x0202 entries');
    }
    offsetEntry.values = [thumbnailOffset];
    lengthEntry.values = [embeddedThumbnail.blob.length];
    // Drop them from the large-data pass if they were pre-sized.
    for (const e of [offsetEntry, lengthEntry]) {
      if (valueBytes.has(e)) {
        dataOffset -= valueBytes.get(e).length;
        valueBytes.delete(e);
        delete e.dataOffset;
      }
    }
  }

  const buf = Buffer.alloc(dataOffset);
  buf.write('II', 0, 'latin1');
  buf.writeUInt16LE(42, 2);
  buf.writeUInt32LE(HEADER, 4); // IFD0 follows the header

  const packValue = (e) => {
    if (valueBytes.has(e)) return valueBytes.get(e);
    if (typeof e.values === 'string') {
      return Buffer.from(e.values + '\0', 'latin1').subarray(0, 4);
    }
    return packScalars(e.values, e.type);
  };

  const writeIfd = (group, offset, nextIfdOffset, pointers = []) => {
    const all = [...group, ...pointers].sort((a, b) => a.tag - b.tag);
    buf.writeUInt16LE(all.length, offset);
    let p = offset + 2;
    for (const e of all) {
      buf.writeUInt16LE(e.tag, p);
      buf.writeUInt16LE(e.type, p + 2);
      const count =
        typeof e.values === 'string' ? e.values.length + 1 : e.values.length;
      buf.writeUInt32LE(count, p + 4);
      if (valueBytes.has(e)) {
        buf.writeUInt32LE(e.dataOffset, p + 8);
        valueBytes.get(e).copy(buf, e.dataOffset);
      } else {
        const raw = packValue(e);
        raw.copy(buf, p + 8, 0, Math.min(raw.length, 4));
      }
      p += 12;
    }
    buf.writeUInt32LE(nextIfdOffset, p); // 0 = end of IFD chain
  };

  const ascii = (s) => ({ type: ASCII, values: s });
  const ifd0Pointers = [];
  if (hasExif) ifd0Pointers.push({ tag: TAG_EXIF_IFD, type: LONG, values: [exifOffset] });
  if (hasGps) ifd0Pointers.push({ tag: TAG_GPS_IFD, type: LONG, values: [gpsOffset] });

  writeIfd(groups.ifd0, HEADER, hasIfd1 ? ifd1Offset : 0, ifd0Pointers);
  if (hasExif) writeIfd(groups.exif, exifOffset, 0);
  if (hasGps) writeIfd(groups.gps, gpsOffset, 0);
  if (hasIfd1) writeIfd(groups.ifd1, ifd1Offset, 0);
  if (embeddedThumbnail) embeddedThumbnail.blob.copy(buf, thumbnailOffset);
  return buf;

  function packScalars(vals, type) {
    const b = Buffer.alloc(vals.length * TYPE_SIZE[type]);
    if (type === SHORT) vals.forEach((v, i) => b.writeUInt16LE(v, i * 2));
    else if (type === LONG) vals.forEach((v, i) => b.writeUInt32LE(v, i * 4));
    else if (type === RATIONAL)
      vals.forEach((v, i) => {
        b.writeUInt32LE(v.n, i * 8);
        b.writeUInt32LE(v.d, i * 8 + 4);
      });
    return b;
  }
}

/** Wrap a TIFF blob into a JPEG APP1 "Exif" segment, inserted after SOI. */
function injectExif(jpeg, tiff) {
  const segmentLength = 2 + 6 + tiff.length; // length field + "Exif\0\0" + tiff
  if (segmentLength > 0xffff) throw new Error(`EXIF segment too large: ${segmentLength}`);
  const length = Buffer.alloc(2);
  length.writeUInt16BE(segmentLength, 0);
  const segment = Buffer.concat([
    Buffer.from([0xff, 0xe1]),
    length,
    Buffer.from('Exif\0\0', 'latin1'),
    tiff,
  ]);
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error('Not a JPEG (no SOI)');
  return Buffer.concat([jpeg.subarray(0, 2), segment, jpeg.subarray(2)]);
}

// ---------------------------------------------------------------------------
// Fixture recipes
// ---------------------------------------------------------------------------
const rat = (n, d) => ({ n, d });

function fullExifTiff(thumbnailBlob) {
  const c = FIXTURE_CONSTANTS;
  const dms = (deg, min, sec) => [rat(deg, 1), rat(min, 1), rat(sec, 1)];
  return buildTiff([
    { ifd: 'ifd0', tag: TAG_MAKE, type: ASCII, values: c.make },
    { ifd: 'ifd0', tag: TAG_MODEL, type: ASCII, values: c.model },
    { ifd: 'exif', tag: 0x829a, type: RATIONAL, values: [rat(1, 250)] }, // ExposureTime
    { ifd: 'exif', tag: 0x829d, type: RATIONAL, values: [rat(8, 1)] }, // FNumber
    { ifd: 'exif', tag: 0x8827, type: SHORT, values: [c.iso] }, // ISOSpeedRatings
    { ifd: 'exif', tag: 0x9003, type: ASCII, values: c.dateTimeOriginal },
    { ifd: 'exif', tag: 0x920a, type: RATIONAL, values: [rat(35, 1)] }, // FocalLength
    { ifd: 'gps', tag: 0x0001, type: ASCII, values: 'N' }, // GPSLatitudeRef
    { ifd: 'gps', tag: 0x0002, type: RATIONAL, values: dms(51, 30, 0) }, // GPSLatitude
    { ifd: 'gps', tag: 0x0003, type: ASCII, values: 'W' }, // GPSLongitudeRef
    { ifd: 'gps', tag: 0x0004, type: RATIONAL, values: dms(0, 7, 40) }, // GPSLongitude
    // IFD1 thumbnail (Compression=6 old-style JPEG + resolution + pointer/length)
    { ifd: 'ifd1', tag: 0x0103, type: SHORT, values: [6] }, // Compression
    { ifd: 'ifd1', tag: 0x011a, type: RATIONAL, values: [rat(72, 1)] }, // XResolution
    { ifd: 'ifd1', tag: 0x011b, type: RATIONAL, values: [rat(72, 1)] }, // YResolution
    { ifd: 'ifd1', tag: 0x0128, type: SHORT, values: [2] }, // ResolutionUnit (inches)
    { ifd: 'ifd1', tag: 0x0201, type: LONG, values: [0] }, // JPEGInterchangeFormat (patched)
    { ifd: 'ifd1', tag: 0x0202, type: LONG, values: [0] }, // JPEGInterchangeFormatLength (patched)
  ], thumbnailBlob ? { blob: thumbnailBlob } : undefined);
}

function noGpsTiff() {
  return buildTiff([
    { ifd: 'ifd0', tag: TAG_MAKE, type: ASCII, values: 'TestCam' },
    { ifd: 'ifd0', tag: TAG_MODEL, type: ASCII, values: 'Hound-2' },
  ]);
}

// ---------------------------------------------------------------------------
// Base pixel data via ImageMagick, KML / text fixtures
// ---------------------------------------------------------------------------
function baseJpeg(name, size = '640x427') {
  const out = join(imgDir, name);
  execFileSync('magick', [
    '-size', size, 'gradient:#2a2a2a-#555555',
    '-quality', '92', out,
  ]);
  return out;
}

const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Site Alpha</name>
      <Point><coordinates>-0.1278,51.5074,0</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Site Beta</name>
      <Point><coordinates>-0.0754,51.5089,0</coordinates></Point>
    </Placemark>
  </Document>
</kml>`;

const invalidText = `this is definitely not KML or CSV location data
just some plain text for the invalid-import spec`;

// ---------------------------------------------------------------------------
// Generate + self-verify
// ---------------------------------------------------------------------------
const fullExifPath = baseJpeg('full-exif.jpg');
// Small standalone JPEG embedded as the EXIF IFD0 thumbnail (used by the
// image comparison view).
const thumbnailBlob = (() => {
  const tmp = join(imgDir, '.thumb.tmp.jpg');
  execFileSync('magick', ['-size', '160x107', 'gradient:#111111-#666666', '-quality', '80', tmp]);
  const blob = readFileSync(tmp);
  rmSync(tmp);
  return blob;
})();
writeFileSync(fullExifPath, injectExif(readFileSync(fullExifPath), fullExifTiff(thumbnailBlob)));

const noGpsPath = baseJpeg('no-gps.jpg');
writeFileSync(noGpsPath, injectExif(readFileSync(noGpsPath), noGpsTiff()));

writeFileSync(
  join(imgDir, 'corrupt.jpg'),
  Buffer.from(Array.from({ length: 512 }, (_, i) => (i * 37 + 11) & 0xff))
);

writeFileSync(join(importDir, 'points.kml'), kml);
writeFileSync(join(importDir, 'invalid.txt'), invalidText);

// Tiny opaque tile used by cy.intercept to serve map tiles offline.
execFileSync('magick', [
  '-size', '16x16', 'xc:#1a1a1a', 'png:' + join(workspace, 'playwright/fixtures/tile.png'),
]);

// Verify with exifreader (available in the workspace's node_modules)
const require = createRequire(join(workspace, 'package.json'));
const ExifReader = require('exifreader');
const c = FIXTURE_CONSTANTS;
const round6 = (x) => Math.round(x * 1e6) / 1e6;
let failed = false;

function verify(path, label, checks) {
  const tags = ExifReader.load(readFileSync(path), { expanded: true });
  for (const [what, actual, expected] of checks) {
    const ok = JSON.stringify(round6(actual)) === JSON.stringify(round6(expected));
    if (!ok) {
      console.error(`FAIL ${label}: ${what} — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
      failed = true;
    }
  }
}

const fullTags = ExifReader.load(readFileSync(fullExifPath), { expanded: true });
verify(fullExifPath, 'full-exif.jpg', [
  ['Make', fullTags.Make?.description, c.make],
  ['Model', fullTags.Model?.description, c.model],
  ['DateTimeOriginal', fullTags.exif?.DateTimeOriginal?.description, c.dateTimeOriginal],
  ['ExposureTime', fullTags.exif?.ExposureTime?.description, c.exposureTime],
  ['FNumber', fullTags.exif?.FNumber?.value?.[0], c.fNumber],
  ['ISOSpeedRatings', fullTags.exif?.ISOSpeedRatings?.description, c.iso],
  ['FocalLength', fullTags.exif?.FocalLength?.value?.[0], c.focalLength],
  ['GPS Latitude', fullTags.gps?.Latitude, c.gps.latitude],
  ['GPS Longitude', fullTags.gps?.Longitude, c.gps.longitude],
]);

const noGpsTags = ExifReader.load(readFileSync(noGpsPath), { expanded: true });
verify(noGpsPath, 'no-gps.jpg', [
  ['Make', noGpsTags.Make?.description, 'TestCam'],
  ['Model', noGpsTags.Model?.description, 'Hound-2'],
  ['No GPS', noGpsTags.gps?.Latitude, undefined],
]);

// The embedded IFD1 thumbnail must surface as a base64 data source.
const thumbTags = ExifReader.load(readFileSync(fullExifPath), { expanded: true });
if (!thumbTags.Thumbnail?.base64 || thumbTags.Thumbnail.base64.length < 100) {
  console.error('FAIL full-exif.jpg: embedded IFD1 thumbnail not recognized by exifreader');
  failed = true;
}

if (failed) {
  console.error('Fixture verification FAILED — fix the writer before committing.');
  process.exit(1);
}
console.log(`E2E fixtures generated and verified under playwright/fixtures/:
  images/full-exif.jpg   (${c.make} ${c.model}, ${c.dateTimeOriginal}, GPS ${c.gps.latitude}, ${c.gps.longitude})
  images/no-gps.jpg      (TestCam Hound-2, no GPS)
  images/corrupt.jpg     (deterministic garbage bytes)
  import/points.kml      (2 placemarks)
  import/invalid.txt     (non-KML text)
  tile.png               (opaque 16x16 tile served to Leaflet)`);
