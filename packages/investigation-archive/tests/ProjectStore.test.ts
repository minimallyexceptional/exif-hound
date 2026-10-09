/**
 * Project store tests: on-disk project folders with data/data.db
 * (openspec/changes/project-folders). Exercises creation, validation,
 * image write-through with dedupe, import registry replacement, and
 * state persistence — all against an in-memory FsPort and real sql.js.
 */
import initSqlJs from 'sql.js';
import {
  ProjectStore,
  createSqlJsProvider,
  InMemoryFs,
  ProjectExistsError,
  InvalidProjectError,
  UnsupportedSchemaError,
  SessionState,
} from '../src/index';

let dbProvider: Awaited<ReturnType<typeof createSqlJsProvider>>;
const fs = new InMemoryFs();

beforeAll(async () => {
  const SQL = await initSqlJs();
  dbProvider = createSqlJsProvider(SQL);
});

const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9, 9]);

describe('project creation and validation', () => {
  it('creates a project folder with data/data.db first and images/ second', async () => {
    const store = await ProjectStore.create(
      { dbProvider, fs },
      '/projects',
      'Case 042',
      '2.7.0'
    );

    // db exists before images dir was created (write order matters)
    expect(fs.operationOrder.slice(0, 4)).toEqual([
      `mkdir:/projects/Case 042`,
      `mkdir:/projects/Case 042/data`,
      `write:/projects/Case 042/data/data.db`,
      `mkdir:/projects/Case 042/images`,
    ]);
    expect(await fs.exists('/projects/Case 042/data/data.db')).toBe(true);
    expect(await fs.exists('/projects/Case 042/images')).toBe(true);

    const meta = await store.getMeta();
    expect(meta.name).toBe('Case 042');
    expect(meta.appVersion).toBe('2.7.0');
    expect(meta.state).toEqual({
      viewMode: 'map',
      showRoute: false,
    });
  });

  it('rejects a name collision without touching the existing project', async () => {
    await ProjectStore.create({ dbProvider, fs }, '/projects', 'Existing', '2.7.0');
    const before = JSON.stringify(fs.snapshot());
    await expect(
      ProjectStore.create({ dbProvider, fs }, '/projects', 'Existing', '2.7.0')
    ).rejects.toBeInstanceOf(ProjectExistsError);
    expect(JSON.stringify(fs.snapshot())).toBe(before);
  });

  it('validates an openable project and rejects invalid folders with typed errors', async () => {
    // valid
    await ProjectStore.create({ dbProvider, fs }, '/projects', 'Valid', '2.7.0');
    await ProjectStore.validate({ dbProvider, fs }, '/projects/Valid'); // no throw

    // missing db
    await fs.mkdir('/projects/NoDb/images');
    await expect(
      ProjectStore.validate({ dbProvider, fs }, '/projects/NoDb')
    ).rejects.toBeInstanceOf(InvalidProjectError);

    // missing images dir
    await fs.mkdir('/projects/NoImages/data');
    await fs.writeFile('/projects/NoImages/data/data.db', new Uint8Array([1]));
    // db is garbage → InvalidProjectError (schema check fails)
    await expect(
      ProjectStore.validate({ dbProvider, fs }, '/projects/NoImages')
    ).rejects.toBeInstanceOf(InvalidProjectError);

    // foreign db bytes with valid layout → schema mismatch
    const SQL = await initSqlJs();
    const foreign = new SQL.Database();
    foreign.run('CREATE TABLE unrelated (x)');
    const foreignBytes = foreign.export();
    foreign.close();
    await fs.mkdir('/projects/ForeignDb/images');
    await fs.mkdir('/projects/ForeignDb/data');
    await fs.writeFile('/projects/ForeignDb/data/data.db', foreignBytes);
    await expect(
      ProjectStore.validate({ dbProvider, fs }, '/projects/ForeignDb')
    ).rejects.toBeInstanceOf(UnsupportedSchemaError);
  });

  it('opens an existing project and restores meta', async () => {
    const store = await ProjectStore.open({ dbProvider, fs }, '/projects/Case 042');
    const meta = await store.getMeta();
    expect(meta.name).toBe('Case 042');
    expect(store.rootPath).toBe('/projects/Case 042');
  });

  it('migrates schema v2 projects without losing images', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Legacy', '2.7.0');
    await store.addImage('legacy.jpg', jpegBytes, { make: 'kept' });
    const legacyEngine = await dbProvider.open(await fs.readFile('/projects/Legacy/data/data.db'));
    await legacyEngine.exec('DROP TABLE ocr_results', [], 'run');
    await legacyEngine.exec('UPDATE investigation_meta SET schema_format_version = 2', [], 'run');
    await fs.writeFile('/projects/Legacy/data/data.db', await legacyEngine.serialize());
    legacyEngine.close();

    const reopened = await ProjectStore.open({ dbProvider, fs }, '/projects/Legacy');
    expect((await reopened.getMeta()).schemaFormatVersion).toBe(7);
    expect((await reopened.listImages())[0].exif).toEqual({ make: 'kept' });
  });

  it('rolls back the half-created folder when creation fails mid-way', async () => {
    const failingFs = new InMemoryFs();
    let failNextDataMkdir = false;
    const origMkdir = failingFs.mkdir.bind(failingFs);
    failingFs.mkdir = (path: string) => {
      if (failNextDataMkdir && path.endsWith('/data')) {
        failNextDataMkdir = false;
        return Promise.reject(new Error('forbidden path: ' + path));
      }
      return origMkdir(path);
    };
    failNextDataMkdir = true;

    await expect(
      ProjectStore.create({ dbProvider, fs: failingFs }, '/projects', 'Doomed', '2.7.0')
    ).rejects.toThrow('forbidden path');

    // The empty root must not linger — otherwise the retry dies with
    // ProjectExistsError on a folder that never became a project.
    expect(await failingFs.exists('/projects/Doomed')).toBe(false);

    // And a retry can succeed cleanly.
    const store = await ProjectStore.create(
      { dbProvider, fs: failingFs },
      '/projects',
      'Doomed',
      '2.7.0'
    );
    expect(store.rootPath).toBe('/projects/Doomed');
  });
});

describe('image write-through', () => {
  it('writes image bytes to images/ and records the row; listing round-trips', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Images', '2.7.0');
    await store.addImage('beach.jpg', jpegBytes, { latitude: 51.5, cameraMake: 'TestCam' });
    await store.addImage('office.png', pngBytes, { cameraMake: 'TestCam' });

    const images = await store.listImages();
    expect(images.map((i) => i.fileName).sort()).toEqual(['beach.jpg', 'office.png']);

    const beach = images.find((i) => i.fileName === 'beach.jpg')!;
    expect(Array.from(beach.bytes!)).toEqual(Array.from(jpegBytes));
    expect(beach.hasImage).toBe(true);
    expect(beach.diskPath).toBe('images/beach.jpg');
    expect(beach.exif).toEqual({ latitude: 51.5, cameraMake: 'TestCam' });
    expect(beach.sourceUrl).toBeNull();
  });

  it('deduplicates colliding filenames on disk', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Dupes', '2.7.0');
    const first = await store.addImage('beach.jpg', jpegBytes, {});
    const second = await store.addImage('beach.jpg', pngBytes, {});
    expect(first.diskPath).not.toBe(second.diskPath);
    expect(second.diskPath).toBe('images/beach-1.jpg');
    const bytes = await fs.readFile(`/projects/Dupes/${second.diskPath}`);
    expect(Array.from(bytes)).toEqual(Array.from(pngBytes));
  });

  it('supports point entries without bytes via sourceUrl', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Points', '2.7.0');
    await store.addImage('Imported Point 1', null, { latitude: 1 }, 'https://example.com/1.jpg');
    const images = await store.listImages();
    expect(images[0].hasImage).toBe(false);
    expect(images[0].bytes).toBeNull();
    expect(images[0].sourceUrl).toBe('https://example.com/1.jpg');
  });

  it('appends OCR results against their stable image ID and returns the latest result', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'OcrResults', '2.7.0');
    const image = await store.addImage('text.png', pngBytes, {});
    expect(image.id).toBeGreaterThan(0);
    await store.saveOcrResult(image.id, 'first text', 92.5);
    await store.saveOcrResult(image.id, 'updated text', 96.25);

    expect(await store.getOcrResult(image.id)).toMatchObject({
      imageId: image.id,
      text: 'updated text',
      confidence: 96.25,
    });
    expect((await store.listWorkflowOcrResults('legacy', 'legacy')).length).toBe(0);
    expect(await store.getOcrResult(image.id + 999)).toBeNull();
    const reopened = await ProjectStore.open({ dbProvider, fs }, '/projects/OcrResults');
    expect(await reopened.getOcrResult(image.id)).toMatchObject({ text: 'updated text' });
  });

  it('persists project workflows, run history, and empty OCR output rows', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'WorkflowRows', '2.7.0');
    const image = await store.addImage('empty.png', pngBytes, {});
    const now = new Date();
    await store.saveWorkflow({ id: 'flow-1', name: 'Inspect', graphJson: '{"nodes":[]}', updatedAt: now });
    await store.createWorkflowRun({
      id: 'run-1', workflowId: 'flow-1', status: 'running', startedAt: now, finishedAt: null,
      currentNodeId: 'ocr-1', completedNodes: 0, totalNodes: 1, error: null,
    });
    const result = await store.appendWorkflowOcrResult({
      imageId: image.id, imageName: image.fileName, text: '', confidence: null,
      processedAt: now, resultStatus: 'no-text', workflowId: 'flow-1', workflowRunId: 'run-1', nodeId: 'ocr-1',
      preprocessingManifest: { profile: 'ocr-default-v1', middlewareVersion: '0.1.0' },
      words: [{ text: 'source', confidence: 99, boundingBox: { x: 0.2, y: 0.3, width: 0.1, height: 0.05 } }],
    });
    await store.updateWorkflowRun({
      id: 'run-1', workflowId: 'flow-1', status: 'completed', startedAt: now, finishedAt: now,
      currentNodeId: null, completedNodes: 1, totalNodes: 1, error: null,
    });
    expect(await store.listWorkflows()).toMatchObject([{ id: 'flow-1', name: 'Inspect' }]);
    expect(await store.listWorkflowRuns('flow-1')).toMatchObject([{ status: 'completed', completedNodes: 1 }]);
    expect(result).toMatchObject({ imageName: 'empty.png', text: '', resultStatus: 'no-text', nodeId: 'ocr-1', provider: 'paddle', engineVersion: 'PaddleOCR.js@0.4.2 / PP-OCRv6_small', preprocessingManifest: { profile: 'ocr-default-v1' }, words: [{ boundingBox: { x: 0.2, y: 0.3, width: 0.1, height: 0.05 } }] });
    expect(await store.listWorkflowOcrResults('flow-1', 'ocr-1')).toHaveLength(1);
  });

  it('persists append-only provenance and identifier results in separate tool histories', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'ForensicRows', '2.7.0');
    const image = await store.addImage('evidence.jpg', jpegBytes, {});
    const now = new Date();
    await store.saveWorkflow({ id: 'forensic-flow', name: 'Forensic review', graphJson: '{}', updatedAt: now });
    await store.createWorkflowRun({
      id: 'forensic-run', workflowId: 'forensic-flow', status: 'running', startedAt: now,
      finishedAt: null, currentNodeId: 'provenance-1', completedNodes: 0, totalNodes: 2, error: null,
    });
    const provenance = {
      imageId: image.id, imageName: image.fileName, result: { indicators: [] }, resultStatus: 'success' as const,
      workflowId: 'forensic-flow', workflowRunId: 'forensic-run', nodeId: 'provenance-1',
      toolVersion: '1.0.0', startedAt: now, finishedAt: now,
      preprocessingManifest: { profile: 'ocr-default-v1', operations: [] },
    };
    const identifier = {
      ...provenance, result: { text: '', words: [], candidates: [] }, nodeId: 'identifiers-1',
    };

    await store.appendWorkflowProvenanceResult(provenance);
    await store.appendWorkflowIdentifierResult(identifier);
    await store.appendWorkflowProvenanceResult({
      ...provenance, result: {}, resultStatus: 'failed', nodeId: 'provenance-1',
      error: 'Malformed image structure', startedAt: new Date(now.getTime() + 1000), finishedAt: new Date(now.getTime() + 1000),
      preprocessingManifest: { profile: 'ocr-default-v1', middlewareVersion: '0.1.0', operations: [] },
    });

    await expect(store.listWorkflowProvenanceResults('forensic-flow', 'provenance-1')).resolves.toMatchObject([
      { resultStatus: 'failed', error: 'Malformed image structure', workflowRunId: 'forensic-run', preprocessingManifest: { profile: 'ocr-default-v1', middlewareVersion: '0.1.0', operations: [] } },
      { resultStatus: 'success', result: { indicators: [] }, imageName: 'evidence.jpg', toolVersion: '1.0.0', startedAt: now, finishedAt: now, preprocessingManifest: { profile: 'ocr-default-v1', operations: [] } },
    ]);
    await expect(store.listWorkflowIdentifierResults('forensic-flow', 'identifiers-1')).resolves.toMatchObject([
      { resultStatus: 'success', result: { text: '', words: [], candidates: [] }, imageId: image.id, nodeId: 'identifiers-1', preprocessingManifest: { profile: 'ocr-default-v1', operations: [] } },
    ]);
  });

  it('migrates schema v4 projects to add forensic result tables without losing OCR rows', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'ForensicMigration', '2.7.0');
    const image = await store.addImage('old.png', pngBytes, {});
    await store.saveOcrResult(image.id, 'preserve OCR', 87);
    const legacyEngine = await dbProvider.open(await fs.readFile('/projects/ForensicMigration/data/data.db'));
    await legacyEngine.exec('UPDATE investigation_meta SET schema_format_version = 4', [], 'run');
    await legacyEngine.exec('DROP TABLE image_provenance_results', [], 'run');
    await legacyEngine.exec('DROP TABLE visual_identifier_results', [], 'run');
    await fs.writeFile('/projects/ForensicMigration/data/data.db', await legacyEngine.serialize());
    legacyEngine.close();

    const reopened = await ProjectStore.open({ dbProvider, fs }, '/projects/ForensicMigration');

    expect((await reopened.getMeta()).schemaFormatVersion).toBe(7);
    expect(await reopened.getOcrResult(image.id)).toMatchObject({ text: 'preserve OCR' });
    const engine = await dbProvider.open(await fs.readFile('/projects/ForensicMigration/data/data.db'));
    const tables = await engine.exec("SELECT name FROM sqlite_master WHERE type='table'", [], 'all');
    engine.close();
    expect(tables.rows.flat()).toEqual(expect.arrayContaining(['image_provenance_results', 'visual_identifier_results']));
  });

  it('adds OCR attribution columns to schema v6 tables and preserves existing result history', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'ManifestMigration', '2.7.0');
    const image = await store.addImage('legacy.png', pngBytes, {});
    const now = new Date();
    await store.saveWorkflow({ id: 'manifest-flow', name: 'Analyze', graphJson: '{}', updatedAt: now });
    await store.createWorkflowRun({ id: 'manifest-run', workflowId: 'manifest-flow', status: 'completed', startedAt: now, finishedAt: now, currentNodeId: null, completedNodes: 1, totalNodes: 1, error: null });
    await store.appendWorkflowOcrResult({ imageId: image.id, imageName: image.fileName, text: 'legacy result', confidence: 90, processedAt: now, workflowId: 'manifest-flow', workflowRunId: 'manifest-run', nodeId: 'ocr' });
    const toolRecord = { imageId: image.id, imageName: image.fileName, result: { ok: true }, resultStatus: 'success' as const, workflowId: 'manifest-flow', workflowRunId: 'manifest-run', nodeId: 'prov', toolVersion: '1', startedAt: now, finishedAt: now };
    await store.appendWorkflowProvenanceResult(toolRecord);
    await store.appendWorkflowIdentifierResult({ ...toolRecord, nodeId: 'ids' });

    const engine = await dbProvider.open(await fs.readFile('/projects/ManifestMigration/data/data.db'));
    await engine.exec('UPDATE investigation_meta SET schema_format_version = 6', [], 'run');
    for (const column of ['preprocessing_manifest_json', 'words_json', 'provider', 'engine_version']) {
      await engine.exec(`ALTER TABLE ocr_results DROP COLUMN ${column}`, [], 'run');
    }
    for (const table of ['image_provenance_results', 'visual_identifier_results']) {
      await engine.exec(`ALTER TABLE ${table} DROP COLUMN preprocessing_manifest_json`, [], 'run');
    }
    await fs.writeFile('/projects/ManifestMigration/data/data.db', await engine.serialize());
    engine.close();

    const reopened = await ProjectStore.open({ dbProvider, fs }, '/projects/ManifestMigration');
    expect((await reopened.getMeta()).schemaFormatVersion).toBe(7);
    expect(await reopened.listWorkflowOcrResults('manifest-flow', 'ocr')).toMatchObject([{ text: 'legacy result', provider: 'tesseract', engineVersion: 'Tesseract.js', preprocessingManifest: undefined, words: [] }]);
    expect(await reopened.listWorkflowProvenanceResults('manifest-flow', 'prov')).toMatchObject([{ result: { ok: true }, preprocessingManifest: undefined }]);
    expect(await reopened.listWorkflowIdentifierResults('manifest-flow', 'ids')).toMatchObject([{ result: { ok: true }, preprocessingManifest: undefined }]);
  });

  it('migrates and preserves existing v3 OCR results', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'LegacyOcr', '2.7.0');
    const image = await store.addImage('old.png', pngBytes, {});
    await store.saveOcrResult(image.id, 'legacy text', 91);
    const legacyEngine = await dbProvider.open(await fs.readFile('/projects/LegacyOcr/data/data.db'));
    await legacyEngine.exec('UPDATE investigation_meta SET schema_format_version = 3', [], 'run');
    await legacyEngine.exec('ALTER TABLE ocr_results RENAME TO upgraded_results', [], 'run');
    await legacyEngine.exec(`CREATE TABLE ocr_results (
      image_id INTEGER PRIMARY KEY REFERENCES images(id) ON DELETE CASCADE,
      text TEXT NOT NULL, confidence REAL NOT NULL, processed_at TEXT NOT NULL
    )`, [], 'run');
    await legacyEngine.exec(`INSERT INTO ocr_results (image_id, text, confidence, processed_at)
      SELECT image_id, text, confidence, processed_at FROM upgraded_results`, [], 'run');
    await legacyEngine.exec('DROP TABLE upgraded_results', [], 'run');
    await fs.writeFile('/projects/LegacyOcr/data/data.db', await legacyEngine.serialize());
    legacyEngine.close();
    const reopened = await ProjectStore.open({ dbProvider, fs }, '/projects/LegacyOcr');
    expect(await reopened.getOcrResult(image.id)).toMatchObject({
      imageId: image.id, imageName: 'old.png', text: 'legacy text', confidence: 91,
    });
  });
});

describe('import registry', () => {
  it('writes the raw import file to data/ and records it', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Imports', '2.7.0');
    await store.addImport('kml', 'points.kml', '<kml></kml>');
    const text = new TextDecoder().decode(await fs.readFile('/projects/Imports/data/points.kml'));
    expect(text).toBe('<kml></kml>');
    const imports = await store.listImports();
    expect(imports).toEqual([{ type: 'kml', fileName: 'points.kml' }]);
  });

  it('replaces the previous import of the same type', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Replace', '2.7.0');
    await store.addImport('kml', 'first.kml', '<kml>first</kml>');
    await store.addImport('kml', 'second.kml', '<kml>second</kml>');

    const imports = await store.listImports();
    expect(imports).toEqual([{ type: 'kml', fileName: 'second.kml' }]);
    await expect(fs.readFile('/projects/Replace/data/first.kml')).rejects.toBeDefined();
    const text = new TextDecoder().decode(await fs.readFile('/projects/Replace/data/second.kml'));
    expect(text).toBe('<kml>second</kml>');
  });

  it('replacing with the same file name overwrites in place without deletion errors', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'SameName', '2.7.0');
    await store.addImport('csv', 'points.csv', 'lat,lon\n1,2');
    await store.addImport('csv', 'points.csv', 'lat,lon\n3,4');
    const imports = await store.listImports();
    expect(imports).toEqual([{ type: 'csv', fileName: 'points.csv' }]);
    const text = new TextDecoder().decode(await fs.readFile('/projects/SameName/data/points.csv'));
    expect(text).toBe('lat,lon\n3,4');
  });
});

describe('readImport', () => {
  it('reads the persisted import text back for re-parsing', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'ReadBack', '2.7.0');
    await store.addImport('kml', 'points.kml', '<kml></kml>');
    const raw = await store.readImport('kml');
    expect(raw).toEqual({ type: 'kml', fileName: 'points.kml', text: '<kml></kml>' });
  });

  it('returns null when no import of that type exists', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Bare', '2.7.0');
    expect(await store.readImport('csv')).toBeNull();
  });

  it('re-reads the current file after a replacement', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Reimport', '2.7.0');
    await store.addImport('csv', 'first.csv', 'a,b');
    await store.addImport('csv', 'second.csv', 'c,d');
    expect(await store.readImport('csv')).toEqual({ type: 'csv', fileName: 'second.csv', text: 'c,d' });
  });
});

describe('state persistence and flush round-trip', () => {
  it('writes session state through and reads it back', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'State', '2.7.0');
    const state: SessionState = {
      viewMode: 'investigation',
      showRoute: true,
    };
    await store.setState(state);
    expect(await store.getState()).toEqual(state);
  });

  it('flush round-trips everything into a fresh store from the same folder', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Flush', '2.7.0');
    await store.addImage('beach.jpg', jpegBytes, { latitude: 51.5 });
    await store.addImage('point', null, { latitude: 2 }, 'https://x/1.jpg');
    await store.addImport('kml', 'points.kml', '<kml></kml>');
    await store.setState({ viewMode: 'workbench', showRoute: true });
    await store.flush();
    await store.close();

    const reopened = await ProjectStore.open({ dbProvider, fs }, '/projects/Flush');
    expect(await reopened.getState()).toEqual({
      viewMode: 'workbench',
      showRoute: true,
    });
    const images = await reopened.listImages();
    expect(images).toHaveLength(2);
    const beach = images.find((i) => i.fileName === 'beach.jpg')!;
    expect(Array.from(beach.bytes!)).toEqual(Array.from(jpegBytes));
    expect(await reopened.listImports()).toEqual([{ type: 'kml', fileName: 'points.kml' }]);
  });

  it('mutations are visible to a fresh open without explicit flush (write-through)', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Wt', '2.7.0');
    await store.addImage('beach.jpg', jpegBytes, { latitude: 51.5 });
    await store.close(); // close flushes
    const reopened = await ProjectStore.open({ dbProvider, fs }, '/projects/Wt');
    expect(await reopened.listImages()).toHaveLength(1);
  });
});
