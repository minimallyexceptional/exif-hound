import type {
  ImageCodec,
  ImageEnhancer,
  ImageProcessingManifest,
  PreprocessImageRequest,
} from './types';
import { ImageProcessingError } from './types';

export interface ImageProcessingLimits {
  maxInputPixels?: number;
  maxInputSide?: number;
  maxOutputPixels?: number;
  maxOutputSide?: number;
}

const DEFAULT_LIMITS: Required<ImageProcessingLimits> = {
  maxInputPixels: 40_000_000,
  maxInputSide: 10_000,
  maxOutputPixels: 60_000_000,
  maxOutputSide: 12_000,
};

export class ImageProcessingMiddleware {
  private readonly limits: Required<ImageProcessingLimits>;

  constructor(
    private readonly codec: ImageCodec,
    private readonly enhancer: ImageEnhancer,
    limits: ImageProcessingLimits = {},
  ) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
  }

  async process(request: PreprocessImageRequest) {
    if (!request.sourceBytes.byteLength) {
      throw new ImageProcessingError('The selected image is empty.', 'empty-input');
    }

    const sourceBytes = request.sourceBytes.slice();
    let decoded;
    try {
      decoded = await this.codec.decode(sourceBytes.slice());
    } catch (cause) {
      if (cause instanceof ImageProcessingError) throw cause;
      throw new ImageProcessingError('The selected image could not be decoded for preprocessing.', 'decode-failed', cause);
    }
    this.validateDimensions(decoded.width, decoded.height, this.limits.maxInputPixels, this.limits.maxInputSide, 'input');
    if (decoded.data.length !== decoded.width * decoded.height * 4) {
      throw new ImageProcessingError('The image decoder returned invalid pixel data.', 'decode-failed');
    }

    request.onProgress?.({ progress: 0.12, status: 'Preparing OCR image' });
    let enhanced;
    try {
      enhanced = await this.enhancer.enhance(decoded, request.onProgress, {
        maxPixels: this.limits.maxOutputPixels,
        maxSide: this.limits.maxOutputSide,
      });
    } catch (cause) {
      throw new ImageProcessingError('The image could not be enhanced for analysis.', 'processing-failed', cause);
    }
    this.validateDimensions(enhanced.image.width, enhanced.image.height, this.limits.maxOutputPixels, this.limits.maxOutputSide, 'output');
    if (enhanced.image.data.length !== enhanced.image.width * enhanced.image.height * 4) {
      throw new ImageProcessingError('The image processor returned invalid pixel data.', 'processing-failed');
    }

    request.onProgress?.({ progress: 0.9, status: 'Saving prepared OCR image' });
    let processedBytes: Uint8Array;
    try {
      processedBytes = await this.codec.encodePng(enhanced.image);
    } catch (cause) {
      throw new ImageProcessingError('The prepared image could not be encoded.', 'encode-failed', cause);
    }
    if (!processedBytes.byteLength) {
      throw new ImageProcessingError('The image encoder returned an empty result.', 'encode-failed');
    }

    const manifest: ImageProcessingManifest = {
      profile: 'ocr-default-v1',
      middlewareVersion: '0.1.0',
      engine: 'opencv.js',
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
      processedWidth: enhanced.image.width,
      processedHeight: enhanced.image.height,
      operations: enhanced.operations,
      quality: enhanced.quality,
      processedToSource: enhanced.processedToSource,
    };
    request.onProgress?.({ progress: 1, status: 'Prepared image ready' });

    return {
      imageId: request.imageId,
      imageName: request.imageName,
      sourceBytes,
      processedBytes,
      manifest,
    };
  }

  private validateDimensions(width: number, height: number, maxPixels: number, maxSide: number, kind: string): void {
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
      throw new ImageProcessingError(`The decoded image has invalid ${kind} dimensions.`, 'decode-failed');
    }
    if (width > maxSide || height > maxSide || width * height > maxPixels) {
      throw new ImageProcessingError(
        `The image ${kind} exceeds the safe preprocessing limit (${maxSide}px per side, ${maxPixels.toLocaleString()} pixels).`,
        'resource-limit',
      );
    }
  }
}
