/**
 * Desktop-side binding between the archive package and the app session model
 * (design.md D6). The package owns format logic; this module maps records
 * to/from ImageData and orchestrates the app-level save/open flows.
 */
import {
  InvestigationArchiveService,
  SaveInput,
  SaveImageInput,
  OpenedImage,
  SessionState,
} from 'investigation-archive';
import { ImageData, ExifData } from '../../types';
import { ImportedPoint } from '../../utils/importData';

export type ArchiveViewMode = 'map' | 'list' | 'investigation';

/** Union with the app's ImportedPoint marker field. */
export type SessionEntry = ImageData | ImportedPoint;

export interface SaveRequest {
  name: string;
  createdAt: Date;
  images: SessionEntry[];
  /** Raw KML/CSV text captured at import time (re-parsed on resume). */
  importedRaw: { type: 'kml' | 'csv'; data: string } | null;
  viewMode: ArchiveViewMode;
  showRoute: boolean;
  investigationTool: string | null;
}

export interface RestoredEntry {
  fileName: string;
  archivePath: string;
  hasImage: boolean;
  bytes: Uint8Array | null;
  exif: unknown;
  sourceUrl: string | null;
}

export interface RestoredSession {
  meta: {
    name: string;
    createdAt: Date;
    savedAt: Date;
    appVersion: string;
    imageCount: number;
  };
  images: SessionEntry[];
  viewMode: ArchiveViewMode;
  showRoute: boolean;
  investigationTool: string | null;
  importedRaw: { type: 'kml' | 'csv'; data: string } | null;
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

/** Session entry → package save record. */
export async function toSaveImage(image: SessionEntry): Promise<SaveImageInput> {
  if (isPointEntry(image)) {
    return {
      fileName: image.file.name,
      bytes: null,
      hasImage: false,
      exif: serializeExif(image.exif),
      sourceUrl: image.url || null,
    };
  }
  const file = image.file as unknown as File;
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    fileName: image.file.name,
    bytes,
    hasImage: true,
    exif: serializeExif(image.exif),
    sourceUrl: null,
  };
}

/** Package opened record → session entry. */
export function toImageData(opened: RestoredEntry): SessionEntry {
  if (opened.sourceUrl !== null || !opened.hasImage) {
    const point: ImportedPoint = {
      id: newId(),
      url: opened.sourceUrl ?? '',
      hasImage: !!opened.sourceUrl,
      file: {
        name: opened.fileName,
        type: 'text/csv',
        size: 0,
        lastModified: 0,
      },
      exif: (opened.exif ?? {}) as ExifData,
      isProcessing: false,
    };
    return point;
  }
  const file = new File([opened.bytes as unknown as BlobPart], opened.fileName, {
    type: mimeFromName(opened.fileName),
  });
  const image: ImageData = {
    id: newId(),
    url: URL.createObjectURL(file),
    file,
    exif: (opened.exif ?? {}) as ExifData,
    isProcessing: false,
  };
  return image;
}

/**
 * Lazily construct the archive service with the sql.js wasm provider.
 * Dynamic import keeps the wasm bootstrap out of module-eval time (and out
 * of unit tests that only exercise the pure mappers).
 */
async function getService(): Promise<InvestigationArchiveService> {
  const [{ getArchiveDbProvider }, { fflateZipper }] = await Promise.all([
    import('./sqlJsEngine'),
    import('investigation-archive'),
  ]);
  return new InvestigationArchiveService({
    dbProvider: await getArchiveDbProvider(),
    zipper: fflateZipper,
  });
}

function toSessionState(req: SaveRequest): SessionState {
  return {
    viewMode: req.viewMode,
    showRoute: req.showRoute,
    investigationTool: req.investigationTool,
    importType: req.importedRaw?.type ?? null,
    importData: req.importedRaw?.data ?? null,
  };
}

export async function buildSaveInput(req: SaveRequest, savedAt: Date): Promise<SaveInput> {
  const images = await Promise.all(req.images.map(toSaveImage));
  return {
    name: req.name,
    createdAt: req.createdAt,
    savedAt,
    appVersion: __APP_VERSION__,
    session: toSessionState(req),
    images,
  };
}

/** Full save: session snapshot → archive bytes + suggested file name. */
export async function saveInvestigation(
  req: SaveRequest,
  savedAt: Date = new Date(),
): Promise<{ bytes: Uint8Array; fileNameSuggestion: string }> {
  const service = await getService();
  return service.save(await buildSaveInput(req, savedAt));
}

/** Full open: archive bytes → restored session (images, view, imports). */
export async function openInvestigation(bytes: Uint8Array): Promise<RestoredSession> {
  const service = await getService();
  const result = await service.open(bytes);

  // Build the full entry list before touching app state — a failure here
  // must leave the current session untouched (spec: open failure leaves
  // state intact).
  const images = result.images.map((entry: OpenedImage) =>
    toImageData(entry as RestoredEntry)
  );

  const session = result.meta.session;
  return {
    meta: {
      name: result.meta.name,
      createdAt: result.meta.createdAt,
      savedAt: result.meta.savedAt,
      appVersion: result.meta.appVersion,
      imageCount: result.meta.imageCount,
    },
    images,
    viewMode: session.viewMode as ArchiveViewMode,
    showRoute: session.showRoute,
    investigationTool: session.investigationTool,
    importedRaw:
      session.importType === 'kml' || session.importType === 'csv'
        ? { type: session.importType, data: session.importData ?? '' }
        : null,
  };
}