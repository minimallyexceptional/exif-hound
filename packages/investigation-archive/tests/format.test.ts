/**
 * Red test: the .investigation archive format round-trip.
 * Drives format.ts, migrations, ArchiveWriter, ArchiveReader and the
 * InvestigationArchiveService facade (design.md D1/D3/D4).
 */
import initSqlJs from 'sql.js';
import {
  InvestigationArchiveService,
  createSqlJsProvider,
  fflateZipper,
  FORMAT_VERSION,
  MANIFEST_ENTRY,
  DATABASE_ENTRY,
  IMAGES_DIR,
  UnsupportedFormatError,
  InvalidArchiveError,
  SaveInput,
} from '../src/index';

let service: InvestigationArchiveService;

beforeAll(async () => {
  const SQL = await initSqlJs();
  service = new InvestigationArchiveService({
    dbProvider: createSqlJsProvider(SQL),
    zipper: fflateZipper,
  });
});

const sessionInput = {
  viewMode: 'map',
  showRoute: true,
  investigationTool: null,
  importType: null,
  importData: null,
};

function saveInput(overrides: Partial<SaveInput> = {}): SaveInput {
  return {
    name: 'Case 042',
    createdAt: new Date('2024-01-15T10:30:00.000Z'),
    savedAt: new Date('2024-01-15T11:00:00.000Z'),
    appVersion: '2.6.6',
    session: sessionInput,
    images: [],
    ...overrides,
  };
}

const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9, 9]);

const imageFixtures = [
  {
    fileName: 'beach.jpg',
    bytes: jpegBytes,
    hasImage: true,
    exif: {
      latitude: 51.5074,
      longitude: -0.1278,
      dateTimeOriginal: '2024:01:15 10:30:00',
      cameraMake: 'TestCam',
      cameraModel: 'T1',
    },
  },
  {
    fileName: 'office.png',
    bytes: pngBytes,
    hasImage: true,
    exif: { cameraMake: 'TestCam', cameraModel: 'T2' },
  },
];

describe('archive format constants', () => {
  it('declares stable entry names and format version', () => {
    expect(MANIFEST_ENTRY).toBe('investigation.json');
    expect(DATABASE_ENTRY).toBe('investigation.db');
    expect(IMAGES_DIR).toBe('images/');
    expect(FORMAT_VERSION).toBe(1);
  });
});

describe('save → open round-trip', () => {
  it('returns an archive whose meta and session state equal the input', async () => {
    const input = saveInput({
      images: imageFixtures,
      session: {
        viewMode: 'investigation',
        showRoute: false,
        investigationTool: 'timeline',
        importType: 'kml',
        importData: '<kml></kml>',
      },
    });

    const saved = await service.save(input);
    expect(saved.fileNameSuggestion).toMatch(/Case 042.*\.investigation$/);
    expect(saved.bytes.byteLength).toBeGreaterThan(0);

    const opened = await service.open(saved.bytes);
    expect(opened.meta.name).toBe('Case 042');
    expect(opened.meta.createdAt).toEqual(new Date('2024-01-15T10:30:00.000Z'));
    expect(opened.meta.savedAt).toEqual(new Date('2024-01-15T11:00:00.000Z'));
    expect(opened.meta.appVersion).toBe('2.6.6');
    expect(opened.meta.imageCount).toBe(2);
    expect(opened.meta.session).toEqual({
      viewMode: 'investigation',
      showRoute: false,
      investigationTool: 'timeline',
      importType: 'kml',
      importData: '<kml></kml>',
    });
  });

  it('preserves image bytes bit-identically and metadata exactly', async () => {
    const saved = await service.save(saveInput({ images: imageFixtures }));
    const opened = await service.open(saved.bytes);

    expect(opened.images.length).toBe(2);
    const beach = opened.images.find((i) => i.fileName === 'beach.jpg')!;
    expect(beach.hasImage).toBe(true);
    expect(Array.from(beach.bytes!)).toEqual(Array.from(jpegBytes));
    expect(beach.exif).toEqual(imageFixtures[0].exif);

    const office = opened.images.find((i) => i.fileName === 'office.png')!;
    expect(Array.from(office.bytes!)).toEqual(Array.from(pngBytes));
  });

  it('deduplicates colliding archive image paths', async () => {
    const dupe = { ...imageFixtures[0] };
    const saved = await service.save(saveInput({ images: [imageFixtures[0], dupe] }));
    const opened = await service.open(saved.bytes);
    const paths = opened.images.map((i) => i.archivePath);
    expect(new Set(paths).size).toBe(2);
    expect(paths[0]).not.toBe(paths[1]);
  });

  it('round-trips imported CSV point entries without image bytes', async () => {
    const points = [
      {
        fileName: 'point-1.csv-entry',
        bytes: null,
        hasImage: false,
        exif: { latitude: 1, longitude: 2 },
        sourceUrl: 'https://example.com/1.jpg',
      },
    ];
    const saved = await service.save(saveInput({ images: points }));
    const opened = await service.open(saved.bytes);
    expect(opened.images[0].hasImage).toBe(false);
    expect(opened.images[0].bytes).toBeNull();
    expect(opened.images[0].sourceUrl).toBe('https://example.com/1.jpg');
    expect(opened.images[0].exif).toEqual({ latitude: 1, longitude: 2 });
  });

  it('tolerates an empty images list', async () => {
    const saved = await service.save(saveInput());
    const opened = await service.open(saved.bytes);
    expect(opened.images).toEqual([]);
    expect(opened.meta.imageCount).toBe(0);
  });

  it('exposes the manifest for cheap inspection', async () => {
    const saved = await service.save(saveInput({ images: imageFixtures }));
    const manifest = await service.readManifest(saved.bytes);
    expect(manifest.formatVersion).toBe(FORMAT_VERSION);
    expect(manifest.name).toBe('Case 042');
    expect(manifest.imageCount).toBe(2);
    expect(manifest.appVersion).toBe('2.6.6');
  });
});

describe('reader validation', () => {
  it('rejects an unsupported format version with UnsupportedFormatError', async () => {
    const saved = await service.save(saveInput());
    const zip = await fflateZipper.unzip(saved.bytes);
    const manifest = JSON.parse(new TextDecoder().decode(zip.get(MANIFEST_ENTRY)!));
    manifest.formatVersion = 999;
    const entries = new Map(zip);
    entries.set(MANIFEST_ENTRY, new TextEncoder().encode(JSON.stringify(manifest)));
    const tampered = await fflateZipper.zip(entries);
    await expect(service.open(tampered)).rejects.toBeInstanceOf(UnsupportedFormatError);
  });

  it('rejects a foreign zip (no manifest) with InvalidArchiveError', async () => {
    const foreign = await fflateZipper.zip(
      new Map([['readme.txt', new TextEncoder().encode('hello')]])
    );
    await expect(service.open(foreign)).rejects.toBeInstanceOf(InvalidArchiveError);
  });

  it('rejects a corrupt manifest with InvalidArchiveError', async () => {
    const tampered = await fflateZipper.zip(
      new Map([[MANIFEST_ENTRY, new TextEncoder().encode('{not json')]])
    );
    await expect(service.open(tampered)).rejects.toBeInstanceOf(InvalidArchiveError);
  });

  it('rejects an archive missing the database entry with InvalidArchiveError', async () => {
    const zip = new Map([[MANIFEST_ENTRY, new TextEncoder().encode(
      JSON.stringify({ formatVersion: FORMAT_VERSION, name: 'x', createdAt: new Date().toISOString(), savedAt: new Date().toISOString(), imageCount: 0, appVersion: '1' })
    )]]);
    await expect(service.open(await fflateZipper.zip(zip))).rejects.toBeInstanceOf(InvalidArchiveError);
  });
});
