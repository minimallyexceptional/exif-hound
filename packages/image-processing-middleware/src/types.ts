export interface RasterImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface ImageCodec {
  decode(sourceBytes: Uint8Array): Promise<RasterImage>;
  encodePng(image: RasterImage): Promise<Uint8Array>;
}

export interface AffineTransform {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface NormalizedBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageOperationRecord {
  name: string;
  applied: boolean;
  parameters?: Record<string, number | string | boolean>;
  reason?: string;
}

export interface ImageQualityMetrics {
  luminanceRange: number;
  noiseRatio: number;
  illuminationRange: number;
  skewDegrees: number;
  skewConfidence: number;
}

export interface ImageProcessingManifest {
  profile: 'ocr-default-v1';
  middlewareVersion: string;
  engine: 'opencv.js';
  sourceWidth: number;
  sourceHeight: number;
  processedWidth: number;
  processedHeight: number;
  operations: ImageOperationRecord[];
  quality: ImageQualityMetrics;
  processedToSource: AffineTransform;
}

export interface ImageAnalysisPacket {
  imageId: number;
  imageName: string;
  sourceBytes: Uint8Array;
  processedBytes: Uint8Array;
  manifest: ImageProcessingManifest;
}

export interface ImageProcessingProgress {
  progress: number;
  status: string;
}

export interface ImageEnhancementResult {
  image: RasterImage;
  operations: ImageOperationRecord[];
  quality: ImageQualityMetrics;
  processedToSource: AffineTransform;
}

export interface ImageEnhancer {
  enhance(
    source: RasterImage,
    onProgress?: (progress: ImageProcessingProgress) => void,
    outputLimits?: { maxPixels: number; maxSide: number },
  ): Promise<ImageEnhancementResult>;
}

export interface PreprocessImageRequest {
  imageId: number;
  imageName: string;
  sourceBytes: Uint8Array;
  onProgress?: (progress: ImageProcessingProgress) => void;
}

export class ImageProcessingError extends Error {
  readonly cause?: unknown;

  constructor(
    message: string,
    readonly code: 'empty-input' | 'decode-failed' | 'resource-limit' | 'processing-failed' | 'encode-failed',
    cause?: unknown,
  ) {
    super(message);
    this.cause = cause;
    this.name = 'ImageProcessingError';
  }
}
