import type { OcrProgress, OcrProvider, OcrResult, OcrWorker, OcrWorkerFactory } from './OcrWorker';

export interface OcrMiddlewareOptions {
  languages?: string | string[];
  workerFactory?: OcrWorkerFactory;
}

export interface OcrRequestOptions {
  languages?: string | string[];
  provider?: OcrProvider;
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
  private readonly workerFactory?: OcrWorkerFactory;
  private readonly defaultLanguages: string[];
  private worker: { worker: OcrWorker; languages: string[] } | null = null;
  private progressHandler?: OcrRequestOptions['onProgress'];
  private queue: Promise<void> = Promise.resolve();
  private disposed = false;
  private disposal: Promise<void> | null = null;

  constructor(options: OcrMiddlewareOptions = {}) {
    this.workerFactory = options.workerFactory;
    this.defaultLanguages = normalizeLanguages(options.languages);
  }

  recognize(image: Blob | Uint8Array, options: OcrRequestOptions = {}): Promise<OcrResult> {
    if (this.disposed) {
      return Promise.reject(new OcrDisposedError());
    }

    let languages: string[];
    const requestedProvider = (options as OcrRequestOptions & { provider?: string }).provider;
    if (requestedProvider !== undefined && requestedProvider !== 'paddle') {
      return Promise.reject(new Error(`Unsupported OCR provider "${String(requestedProvider)}". PaddleOCR is the only supported provider.`));
    }
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
      const worker = this.worker?.worker;
      this.worker = null;
      await worker?.terminate();
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
      const factory = this.workerFactory;
      if (!factory) {
        throw new Error('PaddleOCR is not configured with local runtime assets.');
      }
      let entry = this.worker;
      if (!entry) {
        const worker = await factory.create(languages, progress => this.progressHandler?.({
          status: progress.status,
          progress: Number.isFinite(progress.progress)
            ? Math.min(1, Math.max(0, progress.progress))
            : 0,
        }));
        entry = { worker, languages };
        this.worker = entry;
      } else if (!sameLanguages(entry.languages, languages)) {
        await entry.worker.reinitialize(languages);
        entry.languages = languages;
      }

      const result = await entry.worker.recognize(image);
      return {
        text: result.text,
        confidence: normalizeConfidence(result.confidence),
        words: result.words ?? [],
        provider: 'paddle',
        engineVersion: factory.engineVersion ?? 'PP-OCRv6_small',
      };
    } catch (error) {
      if (error instanceof Error && !/PaddleOCR/i.test(error.message)) {
        throw new Error(`PaddleOCR failed: ${error.message}`);
      }
      throw error;
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
