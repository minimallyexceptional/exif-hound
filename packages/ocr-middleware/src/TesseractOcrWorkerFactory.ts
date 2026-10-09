import Tesseract from 'tesseract.js';
import type { OcrProgress, OcrResult, OcrWorker, OcrWorkerFactory, OcrWorkerOptions } from './OcrWorker';

export class TesseractOcrWorkerFactory implements OcrWorkerFactory {
  async create(
    languages: string[],
    options: OcrWorkerOptions,
    onProgress: (progress: OcrProgress) => void,
  ): Promise<OcrWorker> {
    const worker = await Tesseract.createWorker(languages, Tesseract.OEM.LSTM_ONLY, {
      ...options,
      logger: message => onProgress({ status: message.status, progress: message.progress }),
    });

    return new TesseractOcrWorker(worker);
  }
}

class TesseractOcrWorker implements OcrWorker {
  constructor(private readonly worker: Tesseract.Worker) {}

  async recognize(image: Blob | Uint8Array): Promise<OcrResult> {
    // Tesseract.js accepts Blob at runtime in browsers, but its public ImageLike
    // type omits Blob/typed arrays. Node's worker accepts Uint8Array as well.
    const { data } = await this.worker.recognize(
      image as Tesseract.ImageLike,
      {},
      { text: true },
    );

    return {
      text: data.text ?? '',
      confidence: normalizeConfidence(data.confidence),
    };
  }

  async reinitialize(languages: string[]): Promise<void> {
    await this.worker.reinitialize(languages.join('+'), Tesseract.OEM.LSTM_ONLY);
  }

  async terminate(): Promise<void> {
    await this.worker.terminate();
  }
}

const normalizeConfidence = (confidence: number | null | undefined): number => {
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) return 0;
  return Math.min(100, Math.max(0, confidence));
};
