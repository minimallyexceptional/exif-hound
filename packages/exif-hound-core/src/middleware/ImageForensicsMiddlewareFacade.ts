import {
  ImageForensicsMiddleware,
  ImageProvenanceAnalyzer,
  VisualIdentifierDetector,
  ExifReaderMetadataReader,
  ExifTagLoaderMetadataReader,
  LocalImageStructureReader,
  type ImageForensicsMiddlewareOptions,
} from 'image-forensics-middleware';

export {
  ImageProvenanceAnalyzer,
  ImageForensicsMiddleware,
  VisualIdentifierDetector,
  ExifReaderMetadataReader,
  ExifTagLoaderMetadataReader,
  LocalImageStructureReader,
} from 'image-forensics-middleware';
export type {
  CandidateFamily,
  ForensicImageInput,
  IdentifierCandidate,
  ImageProvenanceResult,
  ImageStructureFacts,
  ImageStructureReader,
  LocalOcrRecognizer,
  MetadataReader,
  ProvenanceIndicator,
  ProvenanceTimestampFacts,
  VisualIdentifierInput,
  VisualIdentifierResult,
  VisualIdentifierSettings,
  ImageForensicsMiddlewareOptions,
} from 'image-forensics-middleware';

export class ImageForensicsMiddlewareFacade {
  readonly instance: ImageForensicsMiddleware;

  constructor(options: ImageForensicsMiddlewareOptions = {}) {
    this.instance = new ImageForensicsMiddleware(options);
  }

  analyzeProvenance(input: Parameters<ImageForensicsMiddleware['analyzeProvenance']>[0]) {
    return this.instance.analyzeProvenance(input);
  }

  detectVisualIdentifiers(
    input: Parameters<ImageForensicsMiddleware['detectVisualIdentifiers']>[0],
    onProgress?: Parameters<ImageForensicsMiddleware['detectVisualIdentifiers']>[1],
  ) {
    return this.instance.detectVisualIdentifiers(input, onProgress);
  }
}
