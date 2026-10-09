import {
  ImageRecord,
  ImportRecord,
  OcrResultRecord,
  WorkflowToolResultRecord,
  ProjectWorkflowRecord,
  WorkflowRunRecord,
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

function mapOcrResult(row: typeof schema.ocrResults.$inferSelect): OcrResultRecord {
  return {
    id: row.id,
    imageId: row.imageId,
    imageName: row.imageName,
    text: row.text,
    confidence: row.confidence,
    resultStatus: row.resultStatus as OcrResultRecord['resultStatus'],
    workflowId: row.workflowId,
    workflowRunId: row.workflowRunId,
    nodeId: row.nodeId,
    processedAt: new Date(row.processedAt),
  };
}

type WorkflowToolRow = typeof schema.imageProvenanceResults.$inferSelect | typeof schema.visualIdentifierResults.$inferSelect;

function mapWorkflowToolResult(row: WorkflowToolRow): WorkflowToolResultRecord {
  let result: unknown;
  try {
    result = JSON.parse(row.resultJson);
  } catch {
    throw new InvalidProjectError(`Corrupt ${row.nodeId} workflow result.`);
  }
  return {
    id: row.id,
    imageId: row.imageId,
    imageName: row.imageName,
    result,
    resultStatus: row.resultStatus as WorkflowToolResultRecord['resultStatus'],
    workflowId: row.workflowId,
    workflowRunId: row.workflowRunId,
    nodeId: row.nodeId,
    toolVersion: row.toolVersion,
    startedAt: new Date(row.startedAt),
    finishedAt: new Date(row.finishedAt),
    error: row.error,
  };
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
      if (typeof version === 'number' && ![2, 3, 4, SCHEMA_FORMAT_VERSION].includes(version)) {
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
    return this.appendWorkflowOcrResult({ imageId, imageName: image[0].fileName, text, confidence, processedAt });
  }

  async appendWorkflowOcrResult(result: OcrResultRecord): Promise<OcrResultRecord> {
    await this.assertHealthy();
    const images = await this.db.select().from(schema.images).where(eq(schema.images.id, result.imageId));
    if (!images[0] || !images[0].hasImage) {
      throw new InvalidProjectError('OCR results can only be saved for a project image.');
    }
    const processedAt = result.processedAt ?? new Date();
    await this.db.insert(schema.ocrResults).values({
      imageId: result.imageId,
      imageName: result.imageName ?? images[0].fileName,
      text: result.text,
      confidence: result.confidence,
      resultStatus: result.resultStatus ?? (result.text.trim() ? 'success' : 'no-text'),
      workflowId: result.workflowId ?? null,
      workflowRunId: result.workflowRunId ?? null,
      nodeId: result.nodeId ?? null,
      processedAt: processedAt.toISOString(),
    });
    await this.flush();
    const rows = await this.db.select().from(schema.ocrResults).where(eq(schema.ocrResults.imageId, result.imageId));
    const saved = rows.sort((a, b) => b.id - a.id)[0];
    return mapOcrResult(saved);
  }

  async getOcrResult(imageId: number): Promise<OcrResultRecord | null> {
    await this.assertHealthy();
    const rows = await this.db.select().from(schema.ocrResults).where(eq(schema.ocrResults.imageId, imageId));
    const row = rows.sort((a, b) => b.id - a.id)[0];
    return row ? mapOcrResult(row) : null;
  }

  async listWorkflowOcrResults(workflowId: string, nodeId: string): Promise<OcrResultRecord[]> {
    await this.assertHealthy();
    const rows = await this.db.select().from(schema.ocrResults);
    return rows
      .filter((row) => row.workflowId === workflowId && row.nodeId === nodeId)
      .sort((a, b) => b.id - a.id)
      .map(mapOcrResult);
  }

  async appendWorkflowProvenanceResult(result: WorkflowToolResultRecord): Promise<WorkflowToolResultRecord> {
    await this.assertHealthy();
    const imageRows = await this.db.select().from(schema.images).where(eq(schema.images.id, result.imageId));
    if (!imageRows[0] || !imageRows[0].hasImage) throw new InvalidProjectError('Forensic results require a local project image.');
    await this.db.insert(schema.imageProvenanceResults).values({
      imageId: result.imageId, imageName: imageRows[0].fileName, resultJson: JSON.stringify(result.result),
      resultStatus: result.resultStatus, workflowId: result.workflowId, workflowRunId: result.workflowRunId,
      nodeId: result.nodeId, toolVersion: result.toolVersion, startedAt: result.startedAt.toISOString(),
      finishedAt: result.finishedAt.toISOString(), error: result.error ?? null,
    });
    await this.flush();
    const rows = await this.db.select().from(schema.imageProvenanceResults);
    return mapWorkflowToolResult(rows.sort((a, b) => b.id - a.id)[0]);
  }

  async listWorkflowProvenanceResults(workflowId: string, nodeId: string): Promise<WorkflowToolResultRecord[]> {
    await this.assertHealthy();
    const rows = await this.db.select().from(schema.imageProvenanceResults);
    return rows.filter(row => row.workflowId === workflowId && row.nodeId === nodeId)
      .sort((a, b) => b.id - a.id).map(mapWorkflowToolResult);
  }

  async appendWorkflowIdentifierResult(result: WorkflowToolResultRecord): Promise<WorkflowToolResultRecord> {
    await this.assertHealthy();
    const imageRows = await this.db.select().from(schema.images).where(eq(schema.images.id, result.imageId));
    if (!imageRows[0] || !imageRows[0].hasImage) throw new InvalidProjectError('Forensic results require a local project image.');
    await this.db.insert(schema.visualIdentifierResults).values({
      imageId: result.imageId, imageName: imageRows[0].fileName, resultJson: JSON.stringify(result.result),
      resultStatus: result.resultStatus, workflowId: result.workflowId, workflowRunId: result.workflowRunId,
      nodeId: result.nodeId, toolVersion: result.toolVersion, startedAt: result.startedAt.toISOString(),
      finishedAt: result.finishedAt.toISOString(), error: result.error ?? null,
    });
    await this.flush();
    const rows = await this.db.select().from(schema.visualIdentifierResults);
    return mapWorkflowToolResult(rows.sort((a, b) => b.id - a.id)[0]);
  }

  async listWorkflowIdentifierResults(workflowId: string, nodeId: string): Promise<WorkflowToolResultRecord[]> {
    await this.assertHealthy();
    const rows = await this.db.select().from(schema.visualIdentifierResults);
    return rows.filter(row => row.workflowId === workflowId && row.nodeId === nodeId)
      .sort((a, b) => b.id - a.id).map(mapWorkflowToolResult);
  }

  async saveWorkflow(record: ProjectWorkflowRecord): Promise<void> {
    await this.assertHealthy();
    await this.db.insert(schema.workbenchWorkflows).values({
      id: record.id, name: record.name, graphJson: record.graphJson, updatedAt: record.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.workbenchWorkflows.id,
      set: { name: record.name, graphJson: record.graphJson, updatedAt: record.updatedAt.toISOString() },
    });
    await this.flush();
  }

  async listWorkflows(): Promise<ProjectWorkflowRecord[]> {
    const rows = await this.db.select().from(schema.workbenchWorkflows);
    return rows.map((row) => ({ ...row, updatedAt: new Date(row.updatedAt) }));
  }

  async createWorkflowRun(record: WorkflowRunRecord): Promise<void> {
    await this.db.insert(schema.workflowRuns).values({
      id: record.id, workflowId: record.workflowId, status: record.status,
      startedAt: record.startedAt.toISOString(), finishedAt: record.finishedAt?.toISOString() ?? null,
      currentNodeId: record.currentNodeId, completedNodes: record.completedNodes,
      totalNodes: record.totalNodes, error: record.error,
    });
    await this.flush();
  }

  async updateWorkflowRun(record: WorkflowRunRecord): Promise<void> {
    await this.db.update(schema.workflowRuns).set({
      status: record.status, startedAt: record.startedAt.toISOString(),
      finishedAt: record.finishedAt?.toISOString() ?? null, currentNodeId: record.currentNodeId,
      completedNodes: record.completedNodes, totalNodes: record.totalNodes, error: record.error,
    }).where(eq(schema.workflowRuns.id, record.id));
    await this.flush();
  }

  async listWorkflowRuns(workflowId: string): Promise<WorkflowRunRecord[]> {
    const rows = await this.db.select().from(schema.workflowRuns).where(eq(schema.workflowRuns.workflowId, workflowId));
    return rows.map((row) => ({
      ...row, status: row.status as WorkflowRunRecord['status'],
      startedAt: new Date(row.startedAt), finishedAt: row.finishedAt ? new Date(row.finishedAt) : null,
    })).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
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
