/**
 * Stable identifiers for the .investigation archive format. Version 1:
 *
 *   investigation.json   manifest (cheap inspection, formatVersion gate)
 *   investigation.db     SQLite database (source of truth for metadata)
 *   images/<name>        uploaded images, bit-identical original bytes
 */

export const FORMAT_VERSION = 1;

export const MANIFEST_ENTRY = 'investigation.json';
export const DATABASE_ENTRY = 'investigation.db';
export const IMAGES_DIR = 'images/';

export const ARCHIVE_EXTENSION = '.investigation';

export interface Manifest {
  formatVersion: number;
  name: string;
  /** ISO timestamps. */
  createdAt: string;
  savedAt: string;
  imageCount: number;
  appVersion: string;
}

/** Session state captured with the investigation (design.md D4). */
export interface SessionState {
  viewMode: string;
  showRoute: boolean;
  investigationTool: string | null;
  importType: 'kml' | 'csv' | null;
  importData: string | null;
}

export interface SaveInput {
  name: string;
  createdAt: Date;
  savedAt: Date;
  appVersion: string;
  session: SessionState;
  images: SaveImageInput[];
}

export interface SaveImageInput {
  fileName: string;
  /** Original bytes; null for imported point entries without local image data. */
  bytes: Uint8Array | null;
  /** True only when `bytes` is present and stored under images/. */
  hasImage: boolean;
  /** Extracted metadata (serializable). */
  exif: unknown;
  /** External image URL for imported point entries; null for real images. */
  sourceUrl?: string | null;
}

export interface OpenedImage {
  fileName: string;
  archivePath: string;
  hasImage: boolean;
  bytes: Uint8Array | null;
  exif: unknown;
  sourceUrl: string | null;
}

export interface OpenResult {
  meta: {
    formatVersion: number;
    name: string;
    createdAt: Date;
    savedAt: Date;
    appVersion: string;
    imageCount: number;
    session: SessionState;
  };
  images: OpenedImage[];
}

/** Filesystem-safe suggestion derived from the investigation name. */
export function suggestFileName(name: string): string {
  const safe = name
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const base = safe.length > 0 ? safe : 'Investigation';
  return base.endsWith(ARCHIVE_EXTENSION)
    ? base
    : `${base}${ARCHIVE_EXTENSION}`;
}

/** Sanitize an original filename for use inside the archive's images/ dir. */
export function sanitizeImageName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? 'image';
  return base.replace(/[\\/:*?"<>|]/g, '-').trim() || 'image';
}