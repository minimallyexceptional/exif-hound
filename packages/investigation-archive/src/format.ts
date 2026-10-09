/**
 * Project folder layout and record types.
 *
 * A project is a named folder inside a user-chosen parent:
 *
 *   <parent>/<project-name>/images/   uploaded images, original bytes
 *   <parent>/<project-name>/data/     data.db + imported KML/CSV files
 */

export const DATA_DIR = 'data';
export const IMAGES_DIR = 'images';
export const DATABASE_FILE = 'data.db';
export const DB_PATH = `${DATA_DIR}/${DATABASE_FILE}`;

export const SCHEMA_FORMAT_VERSION = 3;

export type ImportType = 'kml' | 'csv';

/** Session/investigation state persisted in investigation_meta. */
export interface SessionState {
  viewMode: string;
  showRoute: boolean;
  investigationTool: string | null;
}

export interface ProjectMeta {
  name: string;
  createdAt: Date;
  appVersion: string;
  schemaFormatVersion: number;
  state: SessionState;
}

export interface ImageRecord {
  id: number;
  fileName: string;
  /** Path of the image file relative to the project root ('images/…'). */
  diskPath: string;
  /** True only when original bytes live on disk under images/. */
  hasImage: boolean;
  bytes: Uint8Array | null;
  exif: unknown;
  /** External image URL for imported point entries; null for real images. */
  sourceUrl: string | null;
  addedAt: Date;
}

export interface OcrResultRecord {
  imageId: number;
  text: string;
  confidence: number;
  processedAt: Date;
}

export interface ImportRecord {
  type: ImportType;
  fileName: string;
}

/** Join a native project root with a project-relative path. */
export function joinPath(root: string, relative: string): string {
  const windows = /^[A-Za-z]:[\\/]/.test(root) || root.startsWith('\\\\');
  const separator = windows ? '\\' : '/';
  const base = windows
    ? root.replace(/\//g, '\\').replace(/[\\/]+$/, '')
    : root.replace(/\/+$/, '');
  const child = relative.replace(/[\\/]/g, separator).replace(/^[\\/]+/, '');
  return `${base}${separator}${child}`;
}

/** Sanitize an original filename for use inside the project's images/ dir. */
export function sanitizeImageName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? 'image';
  return base.replace(/[\\/:*?"<>|]/g, '-').trim() || 'image';
}

/** Sanitize an import filename for data/ (extension preserved by caller). */
export function sanitizeImportName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? 'import';
  return base.replace(/[\\/:*?"<>|]/g, '-').trim() || 'import';
}

/** Sanitize a project folder name. */
export function sanitizeProjectName(name: string): string {
  const trimmed = name.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ');
  return trimmed.length > 0 ? trimmed : 'Investigation';
}
