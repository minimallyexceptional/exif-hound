import { ImageForensicsMiddlewareFacade } from '../../src/middleware/ImageForensicsMiddlewareFacade';

describe('ImageForensicsMiddlewareFacade', () => {
  it('analyzeProvenance delegates to ImageForensicsMiddleware', async () => {
    const facade = new ImageForensicsMiddlewareFacade({
      metadataReader: { read: () => ({ Software: 'Adobe Photoshop' }) },
      structureReader: {
        inspect: () => ({
          format: 'png',
          width: 1,
          height: 1,
          quantizationTableFingerprints: [],
        }),
      },
    });

    const result = await facade.analyzeProvenance({
      imageId: 1,
      imageName: 'x.png',
      bytes: new Uint8Array([1, 2, 3]),
    });
    expect(result.schemaVersion).toBe(1);
  });
});
