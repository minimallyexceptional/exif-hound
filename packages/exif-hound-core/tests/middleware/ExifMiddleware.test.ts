import { ExifMiddleware, type ExifTagLoader } from 'exif-middleware';

describe('ExifMiddleware', () => {
  it('uses an injected ExifTagLoader for extractExifData', async () => {
    const loader: ExifTagLoader = {
      loadFlat: () => ({
        Make: { description: 'TestCam', value: 'TestCam' },
      }),
      loadExpanded: () => ({ gps: {} }),
    };
    const middleware = new ExifMiddleware({ tagLoader: loader });
    await expect(middleware.extractExifData(new ArrayBuffer(8))).resolves.toMatchObject({
      make: 'TestCam',
    });
  });
});
