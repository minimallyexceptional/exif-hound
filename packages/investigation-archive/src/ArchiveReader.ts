import {
  Manifest,
  OpenResult,
  OpenedImage,
  SessionState,
  MANIFEST_ENTRY,
  DATABASE_ENTRY,
  FORMAT_VERSION,
} from './format';
import { DatabaseEngineProvider, Zipper } from './ports';
import { runMigrations } from './migrations';
import { createDb, schema } from './db';
import { InvalidArchiveError, UnsupportedFormatError } from './errors';

/**
 * Reads archive bytes back into a typed record. Validation order:
 * manifest present/parseable → formatVersion supported → database present
 * → metadata query → image bytes resolved from the zip.
 */

function parseManifest(manifestBytes: Uint8Array): Manifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(manifestBytes));
  } catch {
    throw new InvalidArchiveError('Archive manifest is not valid JSON.');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new InvalidArchiveError('Archive manifest is not an object.');
  }
  const m = parsed as Record<string, unknown>;
  if (typeof m.formatVersion !== 'number' || typeof m.name !== 'string') {
    throw new InvalidArchiveError('Archive manifest is missing required fields.');
  }
  return parsed as Manifest;
}

function sessionFromRow(row: {
  viewMode: string;
  showRoute: boolean;
  investigationTool: string | null;
  importType: string | null;
  importData: string | null;
}): SessionState {
  const importType =
    row.importType === 'kml' || row.importType === 'csv' ? row.importType : null;
  return {
    viewMode: row.viewMode,
    showRoute: row.showRoute,
    investigationTool: row.investigationTool,
    importType,
    importData: row.importData,
  };
}

export async function readArchive(
  bytes: Uint8Array,
  deps: { dbProvider: DatabaseEngineProvider; zipper: Zipper },
): Promise<OpenResult> {
  let entries: Map<string, Uint8Array>;
  try {
    entries = await deps.zipper.unzip(bytes);
  } catch {
    throw new InvalidArchiveError('File is not a valid .investigation archive (unreadable zip).');
  }

  const manifestBytes = entries.get(MANIFEST_ENTRY);
  if (!manifestBytes) {
    throw new InvalidArchiveError('File is not a valid .investigation archive (no manifest).');
  }
  const manifest = parseManifest(manifestBytes);
  if (manifest.formatVersion !== FORMAT_VERSION) {
    throw new UnsupportedFormatError(manifest.formatVersion, FORMAT_VERSION);
  }
  const dbBytes = entries.get(DATABASE_ENTRY);
  if (!dbBytes) {
    throw new InvalidArchiveError('Archive is missing its metadata database.');
  }

  const engine = await deps.dbProvider.open(dbBytes);
  try {
    await runMigrations(engine);
    const db = createDb(engine);

    const metaRows = await db.select().from(schema.investigations);
    if (metaRows.length === 0) {
      throw new InvalidArchiveError('Archive database has no investigation metadata.');
    }
    const metaRow = metaRows[0];

    const imageRows = await db.select().from(schema.images);
    const images: OpenedImage[] = imageRows.map((row) => {
      const fileBytes = row.hasImage ? (entries.get(row.archivePath) ?? null) : null;
      if (row.hasImage && !fileBytes) {
        throw new InvalidArchiveError(
          `Archive is missing image data for "${row.fileName}".`
        );
      }
      let exif: unknown = null;
      try {
        exif = JSON.parse(row.exifJson);
      } catch {
        throw new InvalidArchiveError(`Corrupt metadata for image "${row.fileName}".`);
      }
      return {
        fileName: row.fileName,
        archivePath: row.archivePath,
        hasImage: row.hasImage,
        bytes: fileBytes,
        exif,
        sourceUrl: row.sourceUrl,
      };
    });

    return {
      meta: {
        formatVersion: metaRow.formatVersion,
        name: metaRow.name,
        createdAt: new Date(metaRow.createdAt),
        savedAt: new Date(metaRow.savedAt),
        appVersion: metaRow.appVersion,
        imageCount: images.length,
        session: sessionFromRow(metaRow),
      },
      images,
    };
  } finally {
    engine.close();
  }
}

/** Cheap manifest-only inspection (no database open, no version rejection). */
export async function readManifestOnly(
  bytes: Uint8Array,
  zipper: Zipper,
): Promise<Manifest> {
  const entries = await zipper.unzip(bytes).catch(() => {
    throw new InvalidArchiveError('File is not a valid .investigation archive (unreadable zip).');
  });
  const manifestBytes = entries.get(MANIFEST_ENTRY);
  if (!manifestBytes) {
    throw new InvalidArchiveError('File is not a valid .investigation archive (no manifest).');
  }
  return parseManifest(manifestBytes);
}