import { ImageProcessingError, ImageProcessingMiddleware } from '../src';
import type { ImageCodec, ImageEnhancer, RasterImage } from '../src/types';

const raster = (width = 20, height = 10): RasterImage => ({
  width,
  height,
  data: new Uint8ClampedArray(width * height * 4),
});
const quality = { luminanceRange: 180, noiseRatio: 0, illuminationRange: 0, skewDegrees: 0, skewConfidence: 0 };
const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

describe('ImageProcessingMiddleware', () => {
  it('creates a versioned PNG packet after enhancement while preserving original bytes', async () => {
    const sourceBytes = new Uint8Array([7, 8, 9]);
    const codec: ImageCodec = {
      decode: jest.fn().mockResolvedValue(raster()),
      encodePng: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    };
    const enhancer: ImageEnhancer = {
      enhance: jest.fn().mockResolvedValue({
        image: raster(40, 20),
        operations: [{ name: 'upscale', applied: true, parameters: { factor: 2 } }],
        quality,
        processedToSource: { a: 0.5, b: 0, c: 0, d: 0.5, e: 0, f: 0 },
      }),
    };
    const middleware = new ImageProcessingMiddleware(codec, enhancer);

    const packet = await middleware.process({ imageId: 3, imageName: 'evidence.png', sourceBytes });

    expect(codec.decode).toHaveBeenCalledWith(sourceBytes);
    expect(enhancer.enhance).toHaveBeenCalledWith(expect.objectContaining({ width: 20, height: 10 }), undefined, { maxPixels: 60_000_000, maxSide: 12_000 });
    expect(codec.encodePng).toHaveBeenCalledWith(expect.objectContaining({ width: 40, height: 20 }));
    expect(packet).toMatchObject({
      imageId: 3,
      imageName: 'evidence.png',
      manifest: {
        profile: 'ocr-default-v1',
        engine: 'opencv.js',
        sourceWidth: 20,
        sourceHeight: 10,
        processedWidth: 40,
        processedHeight: 20,
        processedToSource: { a: 0.5, d: 0.5 },
      },
    });
    expect(packet.sourceBytes).toEqual(new Uint8Array([7, 8, 9]));
    expect(packet.processedBytes).toEqual(new Uint8Array([1, 2, 3]));
    expect(sourceBytes).toEqual(new Uint8Array([7, 8, 9]));
  });

  it('fails closed for empty, unsupported, malformed, or over-limit images', async () => {
    const codec: ImageCodec = { decode: jest.fn(), encodePng: jest.fn() };
    const enhancer = { enhance: jest.fn() } as unknown as ImageEnhancer;
    const middleware = new ImageProcessingMiddleware(codec, enhancer, { maxInputPixels: 100 });

    await expect(middleware.process({ imageId: 1, imageName: 'empty', sourceBytes: new Uint8Array() }))
      .rejects.toMatchObject({ code: 'empty-input' });
    codec.decode = jest.fn().mockRejectedValue(new Error('decoder rejected image'));
    await expect(middleware.process({ imageId: 1, imageName: 'bad', sourceBytes: new Uint8Array([1]) }))
      .rejects.toBeInstanceOf(ImageProcessingError);
    codec.decode = jest.fn().mockResolvedValue(raster(11, 10));
    await expect(middleware.process({ imageId: 1, imageName: 'large', sourceBytes: new Uint8Array([1]) }))
      .rejects.toMatchObject({ code: 'resource-limit' });
    expect(enhancer.enhance).not.toHaveBeenCalled();
  });

  it('does not hand mutable source bytes to codecs and wraps encoding errors', async () => {
    const codec: ImageCodec = {
      decode: jest.fn(async (bytes) => {
        bytes.fill(0);
        return raster();
      }),
      encodePng: jest.fn().mockRejectedValue(new Error('png encode failed')),
    };
    const enhancer: ImageEnhancer = {
      enhance: jest.fn().mockResolvedValue({ image: raster(), operations: [], quality, processedToSource: identity }),
    };
    const sourceBytes = new Uint8Array([7, 8, 9]);
    const middleware = new ImageProcessingMiddleware(codec, enhancer);

    await expect(middleware.process({ imageId: 1, imageName: 'input.png', sourceBytes }))
      .rejects.toMatchObject({ code: 'encode-failed' });
    expect(sourceBytes).toEqual(new Uint8Array([7, 8, 9]));
  });
});
