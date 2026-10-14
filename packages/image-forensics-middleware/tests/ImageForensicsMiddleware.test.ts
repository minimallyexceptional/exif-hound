import { ImageForensicsMiddleware } from '../src';

describe('ImageForensicsMiddleware', () => {
  it('analyzes provenance with injectable metadata reader', async () => {
    const middleware = new ImageForensicsMiddleware({
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
    const result = await middleware.analyzeProvenance({
      imageId: 1,
      imageName: 'a.png',
      bytes: new Uint8Array([1, 2, 3]),
    });
    expect(result.schemaVersion).toBe(1);
    expect(result.indicators.length).toBeGreaterThan(0);
  });

});
