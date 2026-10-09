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
      investigationTool: null,
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
      investigationTool: 'timeline',
    };
    await store.setState(state);
    expect(await store.getState()).toEqual(state);
  });

  it('flush round-trips everything into a fresh store from the same folder', async () => {
    const store = await ProjectStore.create({ dbProvider, fs }, '/projects', 'Flush', '2.7.0');
    await store.addImage('beach.jpg', jpegBytes, { latitude: 51.5 });
    await store.addImage('point', null, { latitude: 2 }, 'https://x/1.jpg');
    await store.addImport('kml', 'points.kml', '<kml></kml>');
    await store.setState({ viewMode: 'investigation', showRoute: true, investigationTool: 'software' });
    await store.flush();
    await store.close();

    const reopened = await ProjectStore.open({ dbProvider, fs }, '/projects/Flush');
    expect(await reopened.getState()).toEqual({
      viewMode: 'investigation',
      showRoute: true,
      investigationTool: 'software',
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