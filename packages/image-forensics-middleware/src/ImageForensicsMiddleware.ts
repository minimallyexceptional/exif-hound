import { ImageProvenanceAnalyzer, type ImageProvenanceAnalyzerOptions } from './ImageProvenanceAnalyzer';
import { VisualIdentifierDetector } from './VisualIdentifierDetector';
import type { ForensicImageInput, ImageProvenanceResult, LocalOcrRecognizer, VisualIdentifierInput, VisualIdentifierResult } from './types';

export interface ImageForensicsMiddlewareOptions extends ImageProvenanceAnalyzerOptions {
  ocrRecognizer?: LocalOcrRecognizer;
}

/** Unified forensics entry with injectable metadata, structure, and OCR ports. */
export class ImageForensicsMiddleware {
  private readonly provenance: ImageProvenanceAnalyzer;
  private readonly ocrRecognizer?: LocalOcrRecognizer;
  private readonly toolVersion: string;

  constructor(options: ImageForensicsMiddlewareOptions = {}) {
    this.provenance = new ImageProvenanceAnalyzer(options);
    this.ocrRecognizer = options.ocrRecognizer;
    this.toolVersion = options.toolVersion ?? '1.0.0';
  }

  analyzeProvenance(input: ForensicImageInput): Promise<ImageProvenanceResult> {
    return this.provenance.analyze(input);
  }

  detectVisualIdentifiers(
    input: VisualIdentifierInput,
    onProgress?: (progress: number, status?: string) => void,
  ): Promise<VisualIdentifierResult> {
    if (!this.ocrRecognizer) {
      return Promise.reject(
        new Error('ImageForensicsMiddleware requires ocrRecognizer for visual identifier detection.'),
      );
    }
    const detector = new VisualIdentifierDetector(this.ocrRecognizer, this.toolVersion);
    return detector.detect(input, onProgress);
  }
}
