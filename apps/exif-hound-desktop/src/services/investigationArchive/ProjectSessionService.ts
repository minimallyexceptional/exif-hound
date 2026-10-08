/**
 * Desktop binding between the project store and the app session model
 * (openspec/changes/project-folders, design.md D3). Maps ProjectStore
 * records to/from ImageData, and exposes the app-level flows:
 * create/open project, persist uploads, imports, and session state.
 */
import { SessionState } from 'investigation-archive';
import { ImageData, ExifData } from '../../types';
import { ImportedPoint } from '../../utils/importData';

export type ProjectViewMode = 'map' | 'list' | 'investigation';

/** Union with the app's ImportedPoint marker field. */
export type SessionEntry = ImageData | ImportedPoint;

export interface ImportRaw {
  type: 'kml' | 'csv';
  data: string;
}

export interface AppSessionState {
  viewMode: ProjectViewMode;
  showRoute: boolean;
  investigationTool: string | null;
}

/** Strip runtime-only fields (geocoding loading state) before persisting. */
export function serializeExif(exif: ExifData): unknown {
  const plain = JSON.parse(JSON.stringify(exif ?? null)) as ExifData;
  if (plain.location && typeof plain.location === 'object') {
    plain.location = { ...plain.location, loading: false };
  }
  return plain;
}

function isPointEntry(image: SessionEntry): image is ImportedPoint {
  return 'hasImage' in image;
}

function newId(): string {
  return Math.random().toString(36).substring(7);
}

function mimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

/** Session entry → package addImage arguments. */
export function toStoreImage(image: SessionEntry): {
  fileName: string;
  bytes: Uint8Array | null;
  exif: unknown;
  sourceUrl: string | null;
} {
  if (isPointEntry(image)) {
    return {
      fileName: image.file.name,
      bytes: null,
      exif: serializeExif(image.exif),
      sourceUrl: image.url || null,
    };
  }
  return {
    fileName: image.file.name,
    bytes: null, // filled by the async caller (file.arrayBuffer())
    exif: serializeExif(image.exif),
    sourceUrl: null,
  };
}

/** ProjectStore image record → session entry. */
export function toImageData(record: {
  fileName: string;
  hasImage: boolean;
  bytes: Uint8Array | null;
  exif: unknown;
  sourceUrl: string | null;
}): SessionEntry {
  if (record.sourceUrl !== null || !record.hasImage) {
    const point: ImportedPoint = {
      id: newId(),
      url: record.sourceUrl ?? '',
      hasImage: !!record.sourceUrl,
      file: {
        name: record.fileName,
        type: 'text/csv',
        size: 0,
        lastModified: 0,
      },
      exif: (record.exif ?? {}) as ExifData,
      isProcessing: false,
    };
    return point;
  }
  const file = new File([record.bytes as unknown as BlobPart], record.fileName, {
    type: mimeFromName(record.fileName),
  });
  const image: ImageData = {
    id: newId(),
    url: URL.createObjectURL(file),
    file,
    exif: (record.exif ?? {}) as ExifData,
    isProcessing: false,
  };
  return image;
}

/** Session state → package SessionState. */
export function toStoreState(state: AppSessionState): SessionState {
  return {
    viewMode: state.viewMode,
    showRoute: state.showRoute,
    investigationTool: state.investigationTool,
  };
}

export function fromStoreState(state: SessionState): AppSessionState {
  return {
    viewMode: state.viewMode as ProjectViewMode,
    showRoute: state.showRoute,
    investigationTool: state.investigationTool,
  };
}