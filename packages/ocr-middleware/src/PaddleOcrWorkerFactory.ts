import type { PaddleOCRCreateOptions } from '@paddleocr/paddleocr-js';
import type { OcrProgress, OcrWorker, OcrWorkerFactory, OcrWorkerResult } from './OcrWorker';

interface PaddleLine { text: string; score: number }
interface PaddlePrediction { items?: PaddleLine[] }
interface PaddleEngine {
  predict(image: unknown): Promise<PaddlePrediction[]>;
  dispose(): Promise<void>;
}

export interface PaddleOcrWorkerFactoryOptions {
  detectionModelUrl: string;
  recognitionModelUrl: string;
  wasmPaths: string;
  createEngine?: (options: PaddleOCRCreateOptions) => Promise<PaddleEngine>;
}

export class PaddleOcrWorkerFactory implements OcrWorkerFactory {
  readonly engineVersion = 'PaddleOCR.js@0.4.2 / PP-OCRv6_small';
  private readonly createEngine: (options: PaddleOCRCreateOptions) => Promise<PaddleEngine>;

  constructor(private readonly options: PaddleOcrWorkerFactoryOptions) {
    this.createEngine = options.createEngine ?? createBrowserEngine;
  }

  async create(languages: string[], onProgress: (progress: OcrProgress) => void): Promise<OcrWorker> {
    assertEnglishLanguage(languages);
    onProgress({ status: 'Loading local PaddleOCR models', progress: 0.05 });
    const engine = await this.createEngine({
      lang: 'en',
      ocrVersion: 'PP-OCRv6',
      textDetectionModelName: 'PP-OCRv6_small_det',
      textRecognitionModelName: 'PP-OCRv6_small_rec',
      textDetectionModelAsset: { url: this.options.detectionModelUrl },
      textRecognitionModelAsset: { url: this.options.recognitionModelUrl },
      worker: true,
      ortOptions: {
        backend: 'wasm',
        wasmPaths: this.options.wasmPaths,
        numThreads: 1,
        simd: true,
      },
    });
    onProgress({ status: 'PaddleOCR models ready', progress: 0.2 });
    return new PaddleOcrWorker(engine, languages, onProgress);
  }
}

class PaddleOcrWorker implements OcrWorker {
  private terminated = false;

  constructor(
    private readonly engine: PaddleEngine,
    private languages: string[],
    private readonly onProgress: (progress: OcrProgress) => void,
  ) {}

  async recognize(image: Blob | Uint8Array): Promise<OcrWorkerResult> {
    this.assertActive();
    this.onProgress({ status: 'Detecting and recognizing text with PaddleOCR', progress: 0.3 });
    const [prediction] = await this.engine.predict(asImageBlob(image));
    const lines = (prediction?.items ?? []).filter(item => item.text.trim());
    this.onProgress({ status: 'PaddleOCR recognition complete', progress: 1 });
    return {
      text: lines.map(item => item.text.trim()).join('\n'),
      confidence: lines.length ? normalizeConfidence(lines.reduce((sum, item) => sum + item.score, 0) / lines.length * 100) : 0,
      // PaddleOCR returns line polygons, not word boxes. Keep the common optional
      // word list empty rather than suggesting line boxes are word coordinates.
      words: [],
    };
  }

  async reinitialize(languages: string[]): Promise<void> {
    this.assertActive();
    assertEnglishLanguage(languages);
    this.languages = [...languages];
  }

  async terminate(): Promise<void> {
    if (this.terminated) return;
    this.terminated = true;
    await this.engine.dispose();
  }

  private assertActive(): void {
    if (this.terminated) throw new Error('This PaddleOCR worker has been terminated.');
  }
}

async function createBrowserEngine(options: PaddleOCRCreateOptions): Promise<PaddleEngine> {
  const { PaddleOCR } = await import('@paddleocr/paddleocr-js');
  return PaddleOCR.create(options) as Promise<PaddleEngine>;
}

function assertEnglishLanguage(languages: string[]): void {
  const supported = languages.length > 0 && languages.every(language => language === 'eng' || language === 'en');
  if (!supported) throw new Error('This PaddleOCR model is configured for English text.');
}

function asImageBlob(image: Blob | Uint8Array): Blob {
  if (image instanceof Blob) return image;
  const bytes = image;
  const type = bytes[0] === 0x89 && bytes[1] === 0x50 ? 'image/png'
    : bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg'
      : bytes[0] === 0x52 && bytes[1] === 0x49 ? 'image/webp' : 'application/octet-stream';
  return new Blob([bytes.slice().buffer as ArrayBuffer], { type });
}

function normalizeConfidence(confidence: number): number {
  return Number.isFinite(confidence) ? Math.min(100, Math.max(0, confidence)) : 0;
}
