import type { ImageProcessingMiddleware } from 'image-processing-middleware';
import { ImageProcessingFacade } from '../../src/middleware/ImageProcessingFacade';
import {
  __resetImageProcessingMiddlewareForTests,
  configureImageProcessingMiddleware,
  preprocessImage,
} from '../../src/middleware/preprocessImage';

describe('ImageProcessingFacade', () => {
  afterEach(() => {
    __resetImageProcessingMiddlewareForTests();
  });

  it('preprocessImage uses middleware from configureImageProcessingMiddleware', async () => {
    const process = jest.fn().mockResolvedValue({
      manifest: { schemaVersion: 1 },
      processedBytes: new Uint8Array([1]),
      sourceBytes: new Uint8Array([1]),
    });
    configureImageProcessingMiddleware({ process } as unknown as ImageProcessingMiddleware);

    const onProgress = jest.fn();
    await preprocessImage(9, 'photo.jpg', new Uint8Array([255]), onProgress);

    expect(process).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: 9,
        imageName: 'photo.jpg',
        sourceBytes: expect.any(Uint8Array),
      }),
    );
  });

  it('ImageProcessingFacade delegates to a provided middleware instance', async () => {
    const process = jest.fn().mockResolvedValue({
      manifest: { schemaVersion: 1 },
      processedBytes: new Uint8Array([2]),
      sourceBytes: new Uint8Array([2]),
    });
    const facade = new ImageProcessingFacade({ process } as unknown as ImageProcessingMiddleware);

    await facade.preprocessImage(1, 'a.png', new Uint8Array([1]), () => {});
    expect(process).toHaveBeenCalledTimes(1);
  });
});
