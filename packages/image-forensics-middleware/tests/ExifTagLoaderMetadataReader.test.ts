import type { ExifTagLoader } from 'exif-middleware';
import { ExifTagLoaderMetadataReader } from '../src';

describe('ExifTagLoaderMetadataReader', () => {
  it('maps ExifTagLoader flat tags into metadata records', () => {
    const tagLoader: ExifTagLoader = {
      loadFlat: () =>
        ({
          Software: { description: 'TestEditor', value: 'TestEditor' },
        }) as ReturnType<ExifTagLoader['loadFlat']>,
      loadExpanded: () => ({ gps: {} }) as ReturnType<ExifTagLoader['loadExpanded']>,
    };
    const reader = new ExifTagLoaderMetadataReader(tagLoader);
    expect(reader.read(new Uint8Array([1, 2, 3]))).toEqual({ Software: 'TestEditor' });
  });
});
