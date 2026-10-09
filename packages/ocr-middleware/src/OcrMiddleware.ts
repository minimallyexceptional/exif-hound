import { TesseractOcrWorkerFactory } from './TesseractOcrWorkerFactory';
import type { OcrProgress, OcrResult, OcrWorker, OcrWorkerFactory, OcrWorkerOptions } from './OcrWorker';

export interface OcrMiddlewareOptions {
  languages?: string | string[];
  workerOptions?: OcrWorkerOptions;
  workerFactory?: OcrWorkerFactory;
}

export interface OcrRequestOptions {
  languages?: string | string[];
  onProgress?: (progress: OcrProgress) => void;
}

const normalizeLanguages = (languages: string | string[] | undefined): string[] => {
  const normalized = (Array.isArray(languages) ? languages : [languages ?? 'eng'])
    .map(language => language.trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    throw new Error('At least one OCR language must be provided.');
  }

  return normalized;
};

export class OcrMiddleware {
  private readonly workerFactory: OcrWorkerFactory;
  private readonly workerOptions: OcrWorkerOptions;
  private readonly defaultLanguages: string[];
  private worker: OcrWorker | null = null;
  private workerLanguages: string[] = [];
  private progressHandler?: OcrRequestOptions['onProgress'];
  private queue: Promise<void> = Promise.resolve();
  private disposed = false;
  private disposal: Promise<void> | null = null;

  constructor(options: OcrMiddlewareOptions = {}) {
    this.workerFactory = options.workerFactory ?? new TesseractOcrWorkerFactory();
    this.workerOptions = options.workerOptions ?? {};
    this.defaultLanguages = normalizeLanguages(options.languages);
  }

  recognize(image: Blob | Uint8Array, options: OcrRequestOptions = {}): Promise<OcrResult> {
    if (this.disposed) {
      return Promise.reject(new OcrDisposedError());
    }

    let languages: string[];
    try {
      languages = normalizeLanguages(options.languages ?? this.defaultLanguages);
    } catch (error) {
      return Promise.reject(error);
    }

    const result = this.queue.then(() => this.performRecognition(image, languages, options.onProgress));
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }

  dispose(): Promise<void> {
    if (this.disposal) return this.disposal;

    this.disposed = true;
    this.disposal = this.queue.then(async () => {
      if (!this.worker) return;
      const worker = this.worker;
      this.worker = null;
      this.workerLanguages = [];
      await worker.terminate();
    });
    return this.disposal;
  }

  private async performRecognition(
    image: Blob | Uint8Array,
    languages: string[],
    onProgress?: OcrRequestOptions['onProgress'],
  ): Promise<OcrResult> {
    this.progressHandler = onProgress;

    try {
      if (!this.worker) {
        this.worker = await this.workerFactory.create(
          languages,
          this.workerOptions,
          progress => this.progressHandler?.({
            status: progress.status,
            progress: Number.isFinite(progress.progress)
              ? Math.min(1, Math.max(0, progress.progress))
              : 0,
          }),
        );
        this.workerLanguages = languages;
      } else if (!sameLanguages(this.workerLanguages, languages)) {
        await this.worker.reinitialize(languages);
        this.workerLanguages = languages;
      }

      const result = await this.worker.recognize(image);
      return {
        text: result.text,
        confidence: normalizeConfidence(result.confidence),
      };
    } finally {
      this.progressHandler = undefined;
    }
  }
}

export class OcrDisposedError extends Error {
  constructor() {
    super('This OCR middleware instance has been disposed. Create a new instance to recognize more images.');
    this.name = 'OcrDisposedError';
  }
}

const sameLanguages = (left: string[], right: string[]): boolean =>
  left.length === right.length && left.every((language, index) => language === right[index]);

const normalizeConfidence = (confidence: number): number => {
  if (!Number.isFinite(confidence)) return 0;
  return Math.min(100, Math.max(0, confidence));
};
