import {
  ImageRecord,
  ImportRecord,
  OcrResultRecord,
  ImportType,
  ProjectMeta,
  SessionState,
  DB_PATH,
  DATA_DIR,
  IMAGES_DIR,
  SCHEMA_FORMAT_VERSION,
  joinPath,
  sanitizeImageName,
  sanitizeImportName,
  sanitizeProjectName,
} from './format';
import { DatabaseEngineProvider, FsPort } from './ports';
import { runMigrations, EXPECTED_TABLES } from './migrations';
import { createDb, schema } from './db';
import {
  InvalidProjectError,
  ProjectExistsError,
  UnsupportedSchemaError,
} from './errors';
import type { DatabaseEngine } from './ports';
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import { eq } from 'drizzle-orm';

export interface ProjectStoreDeps {
  dbProvider: DatabaseEngineProvider;
  fs: FsPort;
}

/** Raw text of an import file, for re-parsing on open. */
export interface ImportRaw {
  type: ImportType;
  fileName: string;
  text: string;
}

/** Common deps plus the resolved root path; bound by create/open. */
interface StoreContext extends ProjectStoreDeps {
  rootPath: string;
}

/**
 * OOP facade over a project folder: data.db write-through persistence for
 * image metadata, imports, and session state; original image bytes written
 * directly to the project's images/ directory.
 *
 * Mutations mark the store dirty; `flush()` (called by close() and by the
 * desktop binding's debounced flush hook) writes data.db back to disk.
 */
export class ProjectStore {
  private constructor(
    private readonly ctx: StoreContext,
    private readonly engine: DatabaseEngine,
    private readonly db: SqliteRemoteDatabase<typeof schema>,
  ) {}

  get rootPath(): string {
    return this.ctx.rootPath;
  }

  /**
   * Create a new project folder: `<parent>/<name>/` with `data/data.db`
   * created FIRST, then `images/`. Fails without touching anything if the
   * target folder already exists.
   */
  static async create(
    deps: ProjectStoreDeps,
    parent: string,
    name: string,
    appVersion: string,
  ): Promise<ProjectStore> {
    const projectName = sanitizeProjectName(name);
    const rootPath = joinPath(parent, projectName);
    if (await deps.fs.exists(rootPath)) {
      throw new ProjectExistsError(rootPath);
    }
    // Roll back the half-created folder on any failure (e.g. the real fs
    // rejecting a deep path), so a retry doesn't die on a stale empty
    // folder with ProjectExistsError. Best-effort: surface the original error.
    try {
      return await this.createWithin(deps, rootPath, projectName, appVersion);
    } catch (error) {
      await deps.fs.removeDir(rootPath).catch(() => {});
      throw error;
    }
  }

  private static async createWithin(
    deps: ProjectStoreDeps,
    rootPath: string,
    projectName: string,
    appVersion: string,
  ): Promise<ProjectStore> {
    await deps.fs.mkdir(rootPath);
    await deps.fs.mkdir(joinPath(rootPath, DATA_DIR));

    // data.db first — before anything else is written.
    const engine = await deps.dbProvider.open();
    await runMigrations(engine);
    const dbBytes = await engine.serialize();
    await deps.fs.writeFile(joinPath(rootPath, DB_PATH), dbBytes);

    await deps.fs.mkdir(joinPath(rootPath, IMAGES_DIR));

    const db = createDb(engine);
    const createdAt = new Date();
    await db.insert(schema.investigations).values({
      id: 1,
      name: projectName,
      createdAt: createdAt.toISOString(),
      appVersion,
      schemaFormatVersion: SCHEMA_FORMAT_VERSION,
      viewMode: 'map',
      showRoute: false,
      investigationTool: null,
    });

    const store = new ProjectStore({ ...deps, rootPath }, engine, db);
    await store.flush();
    return store;
  }

  /** Validate a folder as a project. Throws a typed ProjectError on failure. */
  static async validate(deps: ProjectStoreDeps, rootPath: string): Promise<void> {
    const dbPath = joinPath(rootPath, DB_PATH);
    if (!(await deps.fs.exists(dbPath))) {
      throw new InvalidProjectError(
        `Not a project folder: ${dbPath} is missing.`
      );
    }
    if (!(await deps.fs.exists(joinPath(rootPath, IMAGES_DIR)))) {
      throw new InvalidProjectError(
        `Not a project folder: ${IMAGES_DIR}/ is missing.`
      );
    }
    // The db must open and contain the expected project tables.
    const bytes = await deps.fs.readFile(dbPath).catch(() => {
      throw new InvalidProjectError('Project database could not be read.');
    });
    const engine = await deps.dbProvider.open(bytes);
    try {
      const result = await engine.exec(
        `SELECT name FROM sqlite_master WHERE type='table' AND name IN (${EXPECTED_TABLES.map(() => '?').join(',')})`,
        EXPECTED_TABLES,
        'all',
      );
      const found = new Set(result.rows.map((row) => String(row[0])));
      const missing = EXPECTED_TABLES.filter((t) => !found.has(t));
      if (missing.length > 0) {
        throw new UnsupportedSchemaError(
          `Project database does not match this app's schema (missing: ${missing.join(', ')}).`
        );
      }
      const versionRows = await engine.exec(
        'SELECT schema_format_version FROM investigation_meta LIMIT 1',
        [],
        'all',
      );
      const version = versionRows.rows[0]?.[0];
      if (typeof version === 'number' && version !== 2 && version !== SCHEMA_FORMAT_VERSION) {
        throw new UnsupportedSchemaError(
          `Project database schema version ${version} is not supported (this app supports ${SCHEMA_FORMAT_VERSION}).`
        );
      }
    } finally {
      engine.close();
    }
  }

  /** Open an existing project folder (validates first). */
  static async open(deps: ProjectStoreDeps, rootPath: string): Promise<ProjectStore> {
    await ProjectStore.validate(deps, rootPath);
    const bytes = await deps.fs.readFile(joinPath(rootPath, DB_PATH));
    const engine = await deps.dbProvider.open(bytes);
    await runMigrations(engine); // defensive: forward-migrate old projects
    const store = new ProjectStore({ ...deps, rootPath }, engine, createDb(engine));
    await store.flush();
    return store;
  }

  private async assertHealthy(): Promise<void> {
    // no-op hook point (kept for future integrity checks)
  }

  /** Add an image: bytes written to images/ (deduped), row inserted. */
  async addImage(
    fileName: string,
    bytes: Uint8Array | null,
    exif: unknown,
    sourceUrl: string | null = null,
  ): Promise<ImageRecord> {
    await this.assertHealthy();
    const safeName = sanitizeImageName(fileName);
    const hasImage = bytes !== null;

    let diskPath = `${IMAGES_DIR}/${safeName}`;
    if (hasImage) {
      const dot = safeName.lastIndexOf('.');
      const stem = dot > 0 ? safeName.slice(0, dot) : safeName;
      const ext = dot > 0 ? safeName.slice(dot) : '';
      let counter = 1;
      while (await this.ctx.fs.exists(joinPath(this.ctx.rootPath, diskPath))) {
        diskPath = `${IMAGES_DIR}/${stem}-${counter}${ext}`;
        counter += 1;
      }
      await this.ctx.fs.writeFile(
        joinPath(this.ctx.rootPath, diskPath),
        bytes as Uint8Array,
      );
    }

    const addedAt = new Date();
    await this.db.insert(schema.images).values({
      fileName,
      diskPath,
      exifJson: JSON.stringify(exif ?? null),
      hasImage,
      sourceUrl,
      addedAt: addedAt.toISOString(),
    });
    const rows = await this.db.select().from(schema.images).where(eq(schema.images.diskPath, diskPath));
    await this.flush();

    return {
      id: rows[0].id,
      fileName,
      diskPath,
      hasImage,
      bytes: bytes ? new Uint8Array(bytes) : null,
      exif: exif ?? null,
      sourceUrl,
      addedAt,
    };
  }

  async listImages(): Promise<ImageRecord[]> {
    await this.assertHealthy();
    const rows = await this.db.select().from(schema.images);
    const records: ImageRecord[] = [];
    for (const row of rows) {
      const bytes = row.hasImage
        ? await this.ctx.fs.readFile(joinPath(this.ctx.rootPath, row.diskPath))
        : null;
      let exif: unknown = null;
      try {
        exif = JSON.parse(row.exifJson);
      } catch {
        throw new InvalidProjectError(`Corrupt metadata for image "${row.fileName}".`);
      }
      records.push({
        id: row.id,
        fileName: row.fileName,
        diskPath: row.diskPath,
        hasImage: row.hasImage,
        bytes,
        exif,
        sourceUrl: row.sourceUrl,
        addedAt: new Date(row.addedAt),
      });
    }
    return records;
  }

  async saveOcrResult(imageId: number, text: string, confidence: number): Promise<OcrResultRecord> {
    await this.assertHealthy();
    if (!text.trim()) throw new InvalidProjectError('OCR result text must not be empty.');
    const image = await this.db.select().from(schema.images).where(eq(schema.images.id, imageId));
    if (!image[0] || !image[0].hasImage) {
      throw new InvalidProjectError('OCR results can only be saved for a project image.');
    }
    const processedAt = new Date();
    await this.db.insert(schema.ocrResults).values({
      imageId,
      text,
      confidence,
      processedAt: processedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.ocrResults.imageId,
      set: { text, confidence, processedAt: processedAt.toISOString() },
    });
    await this.flush();
    return { imageId, text, confidence, processedAt };
  }

  async getOcrResult(imageId: number): Promise<OcrResultRecord | null> {
    await this.assertHealthy();
    const rows = await this.db.select().from(schema.ocrResults).where(eq(schema.ocrResults.imageId, imageId));
    const row = rows[0];
    return row ? {
      imageId: row.imageId,
      text: row.text,
      confidence: row.confidence,
      processedAt: new Date(row.processedAt),
    } : null;
  }

  /** Write the raw import file to data/ and upsert the registry row. */
  async addImport(type: ImportType, fileName: string, text: string): Promise<ImportRecord> {
    await this.assertHealthy();
    const safeName = sanitizeImportName(fileName);

    const existing = await this.db
      .select()
      .from(schema.projectImports)
      .where(eq(schema.projectImports.type, type));
    const previous = existing[0];
    if (previous && previous.fileName !== safeName) {
      await this.ctx.fs.deleteFile(joinPath(this.ctx.rootPath, `${DATA_DIR}/${previous.fileName}`));
    }

    await this.ctx.fs.writeFile(
      joinPath(this.ctx.rootPath, `${DATA_DIR}/${safeName}`),
      new TextEncoder().encode(text),
    );

    const addedAt = new Date().toISOString();
    if (previous) {
      await this.db
        .update(schema.projectImports)
        .set({ fileName: safeName, addedAt })
        .where(eq(schema.projectImports.type, type));
    } else {
      await this.db.insert(schema.projectImports).values({ type, fileName: safeName, addedAt });
    }
    await this.flush();

    return { type, fileName: safeName };
  }

  async listImports(): Promise<ImportRecord[]> {
    await this.assertHealthy();
    const rows = await this.db.select().from(schema.projectImports);
    return rows
      .map((row) => ({ type: row.type as ImportType, fileName: row.fileName }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  /** Raw text of the current import of a type; null when none. */
  async readImport(type: ImportType): Promise<ImportRaw | null> {
    const imports = await this.listImports();
    const record = imports.find((i) => i.type === type);
    if (!record) return null;
    const bytes = await this.ctx.fs.readFile(
      joinPath(this.ctx.rootPath, `${DATA_DIR}/${record.fileName}`)
    );
    return { type, fileName: record.fileName, text: new TextDecoder().decode(bytes) };
  }

  async getState(): Promise<SessionState> {
    const rows = await this.db.select().from(schema.investigations);
    if (rows.length === 0) {
      throw new InvalidProjectError('Project database has no investigation metadata.');
    }
    const row = rows[0];
    return {
      viewMode: row.viewMode,
      showRoute: row.showRoute,
      investigationTool: row.investigationTool,
    };
  }

  async setState(state: SessionState): Promise<void> {
    await this.db
      .update(schema.investigations)
      .set({
        viewMode: state.viewMode,
        showRoute: state.showRoute,
        investigationTool: state.investigationTool,
      })
      .where(eq(schema.investigations.id, 1));
    await this.flush();
  }

  async getMeta(): Promise<ProjectMeta> {
    const rows = await this.db.select().from(schema.investigations);
    if (rows.length === 0) {
      throw new InvalidProjectError('Project database has no investigation metadata.');
    }
    const row = rows[0];
    return {
      name: row.name,
      createdAt: new Date(row.createdAt),
      appVersion: row.appVersion,
      schemaFormatVersion: row.schemaFormatVersion,
      state: {
        viewMode: row.viewMode,
        showRoute: row.showRoute,
        investigationTool: row.investigationTool,
      },
    };
  }

  /** Write the current database state to disk (data/data.db). */
  async flush(): Promise<void> {
    const bytes = await this.engine.serialize();
    await this.ctx.fs.writeFile(joinPath(this.ctx.rootPath, DB_PATH), bytes);
  }

  /** Flush and release the engine. */
  async close(): Promise<void> {
    await this.flush();
    this.engine.close();
  }
}
