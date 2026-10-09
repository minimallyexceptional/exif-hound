import Tesseract from 'tesseract.js';
import type { ImageDimensions, ImageDimensionsResolver, OcrProgress, OcrResult, OcrWorker, OcrWorkerFactory, OcrWorkerOptions } from './OcrWorker';

export class TesseractOcrWorkerFactory implements OcrWorkerFactory {
  constructor(private readonly resolveImageDimensions: ImageDimensionsResolver = browserImageDimensions) {}

  async create(
    languages: string[],
    options: OcrWorkerOptions,
    onProgress: (progress: OcrProgress) => void,
  ): Promise<OcrWorker> {
    const worker = await Tesseract.createWorker(languages, Tesseract.OEM.LSTM_ONLY, {
      ...options,
      logger: message => onProgress({ status: message.status, progress: message.progress }),
    });

    return new TesseractOcrWorker(worker, this.resolveImageDimensions);
  }
}

class TesseractOcrWorker implements OcrWorker {
  constructor(
    private readonly worker: Tesseract.Worker,
    private readonly resolveImageDimensions: ImageDimensionsResolver,
  ) {}

  async recognize(image: Blob | Uint8Array): Promise<OcrResult> {
    // Tesseract.js accepts Blob at runtime in browsers, but its public ImageLike
    // type omits Blob/typed arrays. Node's worker accepts Uint8Array as well.
    const { data } = await this.worker.recognize(
      image as Tesseract.ImageLike,
      {},
      { text: true, blocks: true },
    );

    const rawWords = (data.blocks ?? []).flatMap((block: Tesseract.Block) =>
      block.paragraphs.flatMap(paragraph => paragraph.lines.flatMap(line => line.words)));
    const dimensions = rawWords.length ? await this.resolveImageDimensions(image) : null;

    return {
      text: data.text ?? '',
      confidence: normalizeConfidence(data.confidence),
      words: dimensions ? rawWords.map(word => normalizeWord(word, dimensions)) : [],
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

const normalizeWord = (word: Tesseract.Word, dimensions: ImageDimensions) => ({
  text: word.text,
  confidence: normalizeConfidence(word.confidence),
  boundingBox: {
    x: normalizePosition(word.bbox.x0, dimensions.width),
    y: normalizePosition(word.bbox.y0, dimensions.height),
    width: normalizeSize(word.bbox.x1 - word.bbox.x0, dimensions.width),
    height: normalizeSize(word.bbox.y1 - word.bbox.y0, dimensions.height),
  },
});

const normalizePosition = (value: number, dimension: number): number =>
  Math.min(1, Math.max(0, value / dimension));

const normalizeSize = (value: number, dimension: number): number =>
  Math.min(1, Math.max(0, value / dimension));

const browserImageDimensions: ImageDimensionsResolver = async image => {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('This environment cannot determine image dimensions for OCR word locations.');
  }
  const blob = image instanceof Blob
    ? image
    : new Blob([image.slice().buffer as ArrayBuffer]);
  const bitmap = await createImageBitmap(blob);
  try {
    if (!bitmap.width || !bitmap.height) throw new Error('The OCR image has invalid dimensions.');
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
};
