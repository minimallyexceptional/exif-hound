export interface OcrProgress {
  status: string;
  progress: number;
}

export type OcrProvider = 'paddle';

export interface OcrWorkerResult {
  text: string;
  confidence: number;
  words: OcrWord[];
}

export interface OcrResult extends OcrWorkerResult {
  provider: OcrProvider;
  engineVersion: string;
}

export interface OcrWord {
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface ImageDimensions { width: number; height: number }
export type ImageDimensionsResolver = (image: Blob | Uint8Array) => Promise<ImageDimensions>;

export interface OcrWorker {
  recognize(image: Blob | Uint8Array): Promise<OcrWorkerResult>;
  reinitialize(languages: string[]): Promise<void>;
  terminate(): Promise<void>;
}

export interface OcrWorkerFactory {
  readonly engineVersion?: string;
  create(
    languages: string[],
    onProgress: (progress: OcrProgress) => void,
  ): Promise<OcrWorker>;
}
