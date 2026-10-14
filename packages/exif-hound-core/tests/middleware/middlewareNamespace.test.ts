import type { ExifTagLoader } from 'exif-middleware';
import { ExifHoundCore } from '../../src/ExifHoundCore';
import { MiddlewareNamespace } from '../../src/middleware/MiddlewareNamespace';

describe('MiddlewareNamespace and ExifHoundCore wiring', () => {
  it('MiddlewareNamespace forwards exif tagLoader options to the facade', async () => {
    const tagLoader: ExifTagLoader = {
      loadFlat: () => ({ Make: { description: 'NSCam', value: 'NSCam' } }),
      loadExpanded: () => ({ gps: {} }),
    };
    const ns = new MiddlewareNamespace({ exif: { tagLoader } });
    await expect(ns.exif.extractExifData(new ArrayBuffer(4))).resolves.toMatchObject({ make: 'NSCam' });
  });

  it('ExifHoundCore accepts middleware and geocoding provider options', async () => {
    const reverse = jest.fn().mockResolvedValue({ city: 'CoreCity', loading: false });
    const core = new ExifHoundCore({
      reverseGeocodingProvider: { reverse },
      middleware: {
        exif: {
          tagLoader: {
            loadFlat: () => ({ Make: { description: 'CoreCam', value: 'CoreCam' } }),
            loadExpanded: () => ({ gps: {} }),
          },
        },
      },
    });

    await expect(core.geocoding.getLocationFromCoordinates(1, 1)).resolves.toMatchObject({ city: 'CoreCity' });
    await expect(core.middleware.exif.extractExifData(new ArrayBuffer(2))).resolves.toMatchObject({ make: 'CoreCam' });
  });
});
