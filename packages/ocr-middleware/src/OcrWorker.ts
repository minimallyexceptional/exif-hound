export interface OcrProgress {
  status: string;
  progress: number;
}

export interface OcrResult {
  text: string;
  confidence: number;
}

export interface OcrWorker {
  recognize(image: Blob | Uint8Array): Promise<OcrResult>;
  reinitialize(languages: string[]): Promise<void>;
  terminate(): Promise<void>;
}

export interface OcrWorkerFactory {
  create(
    languages: string[],
    options: OcrWorkerOptions,
    onProgress: (progress: OcrProgress) => void,
  ): Promise<OcrWorker>;
}

/** Tesseract.js worker resource and cache settings, kept host-neutral. */
export interface OcrWorkerOptions {
  workerPath?: string;
  corePath?: string;
  langPath?: string;
  cachePath?: string;
  cacheMethod?: 'write' | 'readOnly' | 'refresh' | 'none';
  workerBlobURL?: boolean;
  gzip?: boolean;
}
