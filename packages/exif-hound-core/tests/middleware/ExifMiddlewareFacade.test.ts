import { ExifMiddlewareFacade } from '../../src/middleware/ExifMiddlewareFacade';

describe('ExifMiddlewareFacade', () => {
  it('delegates formatFileSize to exif-middleware', () => {
    const facade = new ExifMiddlewareFacade();
    expect(facade.formatFileSize(1024)).toBe('1 KB');
  });
});
