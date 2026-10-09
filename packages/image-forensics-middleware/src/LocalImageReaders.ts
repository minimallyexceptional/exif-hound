import ExifReader from 'exifreader';
import type { ImageStructureFacts, ImageStructureReader, MetadataReader } from './types';

export class ExifReaderMetadataReader implements MetadataReader {
  read(bytes: Uint8Array): Record<string, unknown> {
    const buffer = bytes.slice().buffer as ArrayBuffer;
    const tags = ExifReader.load(buffer);
    return Object.fromEntries(Object.entries(tags).map(([name, tag]) => [
      name,
      tag.description ?? tag.value,
    ]));
  }
}

export class LocalImageStructureReader implements ImageStructureReader {
  inspect(bytes: Uint8Array): ImageStructureFacts {
    if (isPng(bytes)) {
      if (bytes.length < 24) throw new Error('The PNG image header is truncated.');
      return {
        format: 'png',
        width: readUint32(bytes, 16),
        height: readUint32(bytes, 20),
        quantizationTableFingerprints: [],
      };
    }
    if (isJpeg(bytes)) return inspectJpeg(bytes);
    if (isWebp(bytes)) return { format: 'webp', quantizationTableFingerprints: [] };
    return { format: 'unknown', quantizationTableFingerprints: [] };
  }
}

const isPng = (bytes: Uint8Array): boolean =>
  bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;

const isJpeg = (bytes: Uint8Array): boolean => bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;

const isWebp = (bytes: Uint8Array): boolean =>
  bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP';

function inspectJpeg(bytes: Uint8Array): ImageStructureFacts {
  const facts: ImageStructureFacts = { format: 'jpeg', quantizationTableFingerprints: [], scans: 0, frames: 0 };
  let position = 2;
  while (position < bytes.length) {
    if (bytes[position] !== 0xff) {
      position += 1;
      continue;
    }
    while (position < bytes.length && bytes[position] === 0xff) position += 1;
    if (position >= bytes.length) break;
    const marker = bytes[position++];
    if (marker === 0x00 || marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (position + 1 >= bytes.length) throw new Error('The JPEG image contains a truncated marker.');
    const segmentLength = (bytes[position] << 8) | bytes[position + 1];
    if (segmentLength < 2 || position + segmentLength > bytes.length) throw new Error('The JPEG image contains a truncated segment.');
    const payloadStart = position + 2;
    const payloadEnd = position + segmentLength;
    if (marker === 0xdb) readQuantizationTables(bytes, payloadStart, payloadEnd, facts.quantizationTableFingerprints);
    if (isStartOfFrame(marker)) {
      if (payloadEnd - payloadStart < 5) throw new Error('The JPEG frame header is truncated.');
      facts.height = (bytes[payloadStart + 1] << 8) | bytes[payloadStart + 2];
      facts.width = (bytes[payloadStart + 3] << 8) | bytes[payloadStart + 4];
      facts.frames = (facts.frames ?? 0) + 1;
    }
    if (marker === 0xda) facts.scans = (facts.scans ?? 0) + 1;
    position = payloadEnd;
  }
  if (!facts.width || !facts.height) throw new Error('The JPEG image has no supported frame dimensions.');
  return facts;
}

function readQuantizationTables(bytes: Uint8Array, start: number, end: number, fingerprints: string[]): void {
  let cursor = start;
  while (cursor < end) {
    const tableInfo = bytes[cursor];
    const precision = tableInfo >> 4;
    const tableBytes = precision === 0 ? 64 : precision === 1 ? 128 : 0;
    if (!tableBytes || cursor + 1 + tableBytes > end) throw new Error('The JPEG quantization table is truncated.');
    fingerprints.push(hashBytes(bytes, cursor, cursor + 1 + tableBytes));
    cursor += 1 + tableBytes;
  }
}

function isStartOfFrame(marker: number): boolean {
  return [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
}

function hashBytes(bytes: Uint8Array, start: number, end: number): string {
  let hash = 0x811c9dc5;
  for (let index = start; index < end; index += 1) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return bytes[offset] * 0x1000000 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}
