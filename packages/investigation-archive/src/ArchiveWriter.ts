import {
  SaveInput,
  Manifest,
  MANIFEST_ENTRY,
  DATABASE_ENTRY,
  IMAGES_DIR,
  suggestFileName,
  sanitizeImageName,
} from './format';
import { DatabaseEngineProvider, Zipper } from './ports';
import { runMigrations } from './migrations';
import { createDb, schema } from './db';

/**
 * Builds the archive bytes for a save input: manifest + SQLite database +
 * bit-identical image entries. Deduplicates colliding image paths.
 */

export interface BuiltArchive {
  bytes: Uint8Array;
  fileNameSuggestion: string;
  manifest: Manifest;
  /** archivePath for each input image, in order. */
  archivePaths: string[];
}

function uniqueArchivePath(used: Set<string>, fileName: string): string {
  const safe = sanitizeImageName(fileName);
  const dot = safe.lastIndexOf('.');
  const stem = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : '';
  let candidate = IMAGES_DIR + safe;
  let counter = 1;
  while (used.has(candidate)) {
    candidate = `${IMAGES_DIR}${stem}-${counter}${ext}`;
    counter += 1;
  }
  used.add(candidate);
  return candidate;
}

export async function buildArchive(
  input: SaveInput,
  deps: { dbProvider: DatabaseEngineProvider; zipper: Zipper },
): Promise<BuiltArchive> {
  const engine = await deps.dbProvider.open();
  try {
    await runMigrations(engine);
    const db = createDb(engine);

    const used = new Set<string>();
    const archivePaths: string[] = [];
    const imageRows = input.images.map((image) => {
      const archivePath = uniqueArchivePath(used, image.fileName);
      archivePaths.push(archivePath);
      return {
        fileName: image.fileName,
        archivePath,
        exifJson: JSON.stringify(image.exif ?? null),
        hasImage: image.hasImage,
        sourceUrl: image.sourceUrl ?? null,
        addedAt: new Date().toISOString(),
      };
    });

    await db.insert(schema.investigations).values({
      id: 1,
      name: input.name,
      createdAt: input.createdAt.toISOString(),
      savedAt: input.savedAt.toISOString(),
      appVersion: input.appVersion,
      formatVersion: 1,
      viewMode: input.session.viewMode,
      showRoute: input.session.showRoute,
      investigationTool: input.session.investigationTool,
      importType: input.session.importType,
      importData: input.session.importData,
    });

    if (imageRows.length > 0) {
      await db.insert(schema.images).values(imageRows);
    }

    const manifest: Manifest = {
      formatVersion: 1,
      name: input.name,
      createdAt: input.createdAt.toISOString(),
      savedAt: input.savedAt.toISOString(),
      imageCount: input.images.length,
      appVersion: input.appVersion,
    };

    const dbBytes = await engine.serialize();
    const entries = new Map<string, Uint8Array>();
    entries.set(MANIFEST_ENTRY, new TextEncoder().encode(JSON.stringify(manifest, null, 2)));
    entries.set(DATABASE_ENTRY, dbBytes);
    for (const [index, image] of input.images.entries()) {
      if (image.hasImage && image.bytes) {
        entries.set(archivePaths[index], image.bytes);
      }
    }

    const bytes = await deps.zipper.zip(entries);
    return {
      bytes,
      fileNameSuggestion: suggestFileName(input.name),
      manifest,
      archivePaths,
    };
  } finally {
    engine.close();
  }
}