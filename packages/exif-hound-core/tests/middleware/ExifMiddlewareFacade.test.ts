import { ExifMiddlewareFacade } from '../../src/middleware/ExifMiddlewareFacade';

describe('ExifMiddlewareFacade', () => {
  it('delegates formatFileSize to exif-middleware', () => {
    const facade = new ExifMiddlewareFacade();
    expect(facade.formatFileSize(1024)).toBe('1 KB');
  });

  it('forwards tagLoader options to the underlying ExifMiddleware instance', async () => {
    const facade = new ExifMiddlewareFacade({
      tagLoader: {
        loadFlat: () => ({ Model: { description: 'FacadeModel', value: 'FacadeModel' } }),
        loadExpanded: () => ({ gps: {} }),
      },
    });
    await expect(facade.extractExifData(new ArrayBuffer(8))).resolves.toMatchObject({ model: 'FacadeModel' });
  });
});
