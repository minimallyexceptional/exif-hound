/**
 * RED: session mapping between the archive package's records and the app's
 * ImageData/ImportedPoint model (design.md D6).
 */
import {
  toSaveImage,
  toImageData,
  serializeExif,
  RestoredEntry,
} from '../ArchiveSessionService';
import { ImageData } from '../../../types';

function fakeFile(name: string, bytes: Uint8Array): File {
  // jsdom File accepts array parts; keep bytes for equality checks.
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

describe('toSaveImage', () => {
  it('serializes a real image with bytes and no sourceUrl', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const image: ImageData = {
      id: 'x',
      url: 'blob:x',
      file: fakeFile('photo.png', bytes),
      exif: { latitude: 51.5 },
    };
    const out = await toSaveImage(image);
    expect(out.fileName).toBe('photo.png');
    expect(Array.from(out.bytes!)).toEqual(Array.from(bytes));
    expect(out.hasImage).toBe(true);
    expect(out.sourceUrl).toBeNull();
    expect(out.exif).toEqual({ latitude: 51.5 });
  });

  it('serializes an imported point entry without bytes and with sourceUrl', async () => {
    const image = {
      id: 'p',
      url: 'https://example.com/a.jpg',
      hasImage: true,
      file: { name: 'Imported Point 1', type: 'text/csv', size: 0, lastModified: 0 },
      exif: { latitude: 2, longitude: 3 },
    } as unknown as ImageData;
    const out = await toSaveImage(image);
    expect(out.bytes).toBeNull();
    expect(out.hasImage).toBe(false);
    expect(out.sourceUrl).toBe('https://example.com/a.jpg');
    expect(out.fileName).toBe('Imported Point 1');
  });
});

describe('toImageData', () => {
  it('rebuilds a real image from bytes with an object URL', () => {
    const bytes = new Uint8Array([5, 6, 7, 8]);
    const restored: RestoredEntry = {
      fileName: 'photo.png',
      archivePath: 'images/photo.png',
      hasImage: true,
      bytes,
      exif: { latitude: 9 },
      sourceUrl: null,
    };
    const image = toImageData(restored) as ImageData & { hasImage?: boolean };
    expect(image.url).toBe('mock-object-url');
    expect(image.file.name).toBe('photo.png');
    expect(image.exif).toEqual({ latitude: 9 });
    expect(image.isProcessing).toBe(false);
    expect('hasImage' in image).toBe(false);
  });

  it('rebuilds a point entry from sourceUrl without an object URL', () => {
    const restored: RestoredEntry = {
      fileName: 'Imported Point 1',
      archivePath: 'images/point.csv-entry',
      hasImage: false,
      bytes: null,
      exif: { latitude: 3 },
      sourceUrl: 'https://example.com/a.jpg',
    };
    const image = toImageData(restored) as ImageData & { hasImage?: boolean };
    expect(image.url).toBe('https://example.com/a.jpg');
    expect(image.hasImage).toBe(true);
    expect(image.exif).toEqual({ latitude: 3 });
  });

  it('rebuilds a point entry without a url as hasImage false', () => {
    const restored: RestoredEntry = {
      fileName: 'Imported Point 2',
      archivePath: 'images/point2.csv-entry',
      hasImage: false,
      bytes: null,
      exif: { latitude: 4 },
      sourceUrl: null,
    };
    const image = toImageData(restored) as ImageData & { hasImage?: boolean };
    expect(image.url).toBe('');
    expect(image.hasImage).toBe(false);
  });
});