/**
 * RED: session mapping for the project-folder model.
 */
import {
  toImageData,
  toStoreImage,
  toStoreState,
  fromStoreState,
  serializeExif,
  applyPersistedExif,
} from '../ProjectSessionService';
import { ImageData } from '../../../types';

function fakeFile(name: string, bytes: Uint8Array): File {
  return new File([bytes as unknown as BlobPart], name, { type: 'image/png' });
}

describe('serializeExif', () => {
  it('strips runtime loading state but keeps data', () => {
    const exif = {
      latitude: 1,
      longitude: 2,
      location: { loading: true, display_name: 'London' },
    };
    const out = serializeExif(exif as never) as {
      latitude: number;
      location: { loading?: boolean; display_name: string };
    };
    expect(out.latitude).toBe(1);
    expect(out.location?.loading).toBe(false);
    expect(out.location?.display_name).toBe('London');
  });
});

describe('toStoreImage', () => {
  it('serializes a real image (bytes filled async by caller)', () => {
    const image: ImageData = {
      id: 'x',
      url: 'blob:x',
      file: fakeFile('photo.png', new Uint8Array([1, 2, 3, 4])),
      exif: { latitude: 51.5 },
    };
    const out = toStoreImage(image);
    expect(out.fileName).toBe('photo.png');
    expect(out.bytes).toBeNull();
    expect(out.sourceUrl).toBeNull();
    expect(out.exif).toEqual({ latitude: 51.5 });
  });

  it('serializes an imported point entry without bytes and with sourceUrl', () => {
    const image = {
      id: 'p',
      url: 'https://example.com/a.jpg',
      hasImage: true,
      file: { name: 'Imported Point 1', type: 'text/csv', size: 0, lastModified: 0 },
      exif: { latitude: 2, longitude: 3 },
    } as unknown as ImageData;
    const out = toStoreImage(image);
    expect(out.bytes).toBeNull();
    expect(out.sourceUrl).toBe('https://example.com/a.jpg');
    expect(out.fileName).toBe('Imported Point 1');
  });
});

describe('toImageData', () => {
  it('rebuilds a real image from disk bytes with an object URL', () => {
    const record = {
      id: 42,
      fileName: 'photo.png',
      diskPath: 'images/photo.png',
      hasImage: true,
      bytes: new Uint8Array([5, 6, 7, 8]),
      exif: { latitude: 9 },
      sourceUrl: null,
    };
    const image = toImageData(record) as ImageData & { hasImage?: boolean };
    expect(image.url).toBe('mock-object-url');
    expect(image.file.name).toBe('photo.png');
    expect(image.exif).toEqual({ latitude: 9 });
    expect(image.projectImageId).toBe(42);
    expect(image.isProcessing).toBe(false);
    expect('hasImage' in image).toBe(false);
  });

  it('rebuilds a point entry from sourceUrl without an object URL', () => {
    const record = {
      id: 43,
      fileName: 'Imported Point 1',
      diskPath: 'images/point.csv-entry',
      hasImage: false,
      bytes: null,
      exif: { latitude: 3 },
      sourceUrl: 'https://example.com/a.jpg',
    };
    const image = toImageData(record) as ImageData & { hasImage?: boolean };
    expect(image.url).toBe('https://example.com/a.jpg');
    expect(image.hasImage).toBe(true);
    expect(image.exif).toEqual({ latitude: 3 });
  });

  it('rebuilds a point entry without a url as hasImage false', () => {
    const record = {
      id: 44,
      fileName: 'Imported Point 2',
      diskPath: 'images/point2.csv-entry',
      hasImage: false,
      bytes: null,
      exif: { latitude: 4 },
      sourceUrl: null,
    };
    const image = toImageData(record) as ImageData & { hasImage?: boolean };
    expect(image.url).toBe('');
    expect(image.hasImage).toBe(false);
  });
});

describe('state mapping', () => {
  it('maps supported app state to store state and back', () => {
    const app = { viewMode: 'workbench' as const, showRoute: true };
    const store = toStoreState(app);
    expect(store).toEqual(app);
    expect(fromStoreState(store)).toEqual(app);
  });

  it('opens projects saved in the retired Investigation view in Workbench', () => {
    expect(fromStoreState({ viewMode: 'investigation', showRoute: true })).toEqual({
      viewMode: 'workbench',
      showRoute: true,
    });
  });

  it('falls back to Map for unknown saved views', () => {
    expect(fromStoreState({ viewMode: 'unknown', showRoute: false })).toEqual({
      viewMode: 'map',
      showRoute: false,
    });
  });
});

describe('applyPersistedExif', () => {
  it('copies projectImageId and exif from the record and leaves session identity unchanged', () => {
    const file = fakeFile('photo.png', new Uint8Array([1, 2, 3]));
    const image: ImageData = {
      id: 'session-1',
      url: 'blob:keep-me',
      file,
      exif: { latitude: 1, location: { loading: true } },
      isProcessing: false,
    };
    const recordExif = { latitude: 1, location: { loading: false } };
    const out = applyPersistedExif(image, { id: 99, exif: recordExif });

    expect(out.id).toBe('session-1');
    expect(out.url).toBe('blob:keep-me');
    expect(out.file).toBe(file);
    expect(out.isProcessing).toBe(false);
    expect(out.projectImageId).toBe(99);
    expect(out.exif).toEqual(recordExif);
    expect(out.exif).not.toBe(image.exif);
  });

  it('hydrates EXIF from serialized database JSON, not the pre-persist object', () => {
    const file = fakeFile('photo.png', new Uint8Array([1]));
    const prePersist = {
      latitude: 51.5,
      location: { loading: true, formatted: 'London' },
    };
    const image: ImageData = {
      id: 'session-2',
      url: 'blob:2',
      file,
      exif: prePersist,
    };
    const stored = serializeExif(prePersist);
    const out = applyPersistedExif(image, {
      id: 7,
      exif: JSON.parse(JSON.stringify(stored)),
    });

    expect(out.exif).toEqual({
      latitude: 51.5,
      location: { loading: false, formatted: 'London' },
    });
    expect(out.exif).not.toBe(prePersist);
    expect(out.projectImageId).toBe(7);
  });
});
