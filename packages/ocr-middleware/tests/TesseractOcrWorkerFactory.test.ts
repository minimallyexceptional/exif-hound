import Tesseract from 'tesseract.js';
import { OcrWorker } from '../src';
import { TesseractOcrWorkerFactory } from '../src/TesseractOcrWorkerFactory';

jest.mock('tesseract.js', () => ({ createWorker: jest.fn(), OEM: { LSTM_ONLY: 1 } }));

const makeWorker = () => ({
  recognize: jest.fn().mockResolvedValue({ data: { text: 'found text', confidence: 88, words: [] } }),
  reinitialize: jest.fn().mockResolvedValue(undefined),
  terminate: jest.fn().mockResolvedValue(undefined),
});

describe('TesseractOcrWorkerFactory', () => {
  const createWorker = Tesseract.createWorker as jest.Mock;

  beforeEach(() => createWorker.mockReset());

  it('forwards configured worker resources and maps progress events', async () => {
    const engineWorker = makeWorker();
    createWorker.mockResolvedValue(engineWorker);
    const factory = new TesseractOcrWorkerFactory();
    const resources = { workerPath: '/local/worker.js', corePath: '/local/core', langPath: '/local/lang' };
    const onProgress = jest.fn();

    await factory.create(['eng'], resources, onProgress);

    expect(createWorker).toHaveBeenCalledWith(['eng'], Tesseract.OEM.LSTM_ONLY, expect.objectContaining(resources));
    const workerOptions = createWorker.mock.calls[0][2];
    workerOptions.logger({ status: 'recognizing text', progress: 0.42 });
    expect(onProgress).toHaveBeenCalledWith({ status: 'recognizing text', progress: 0.42 });
  });

  it.each([
    ['Blob', new Blob([new Uint8Array([1, 2])], { type: 'image/png' })],
    ['Uint8Array', new Uint8Array([1, 2])],
  ])('maps recognition text and confidence from Tesseract output for %s input', async (_label, image) => {
    const engineWorker = makeWorker();
    createWorker.mockResolvedValue(engineWorker);
    const worker: OcrWorker = await new TesseractOcrWorkerFactory().create(['eng'], {}, () => {});

    await expect(worker.recognize(image)).resolves.toEqual({ text: 'found text', confidence: 88, words: [] });
    expect(engineWorker.recognize).toHaveBeenCalledWith(image, {}, { text: true, blocks: true });
  });

  it('normalizes Tesseract word boxes to the source image dimensions', async () => {
    const engineWorker = makeWorker();
    engineWorker.recognize.mockResolvedValue({ data: {
      text: 'ABC 123', confidence: 91,
      blocks: [{ paragraphs: [{ lines: [{ words: [
        { text: 'ABC', confidence: 90, bbox: { x0: 20, y0: 10, x1: 60, y1: 30 } },
      ] }] }] }],
    } });
    createWorker.mockResolvedValue(engineWorker);
    const worker = await new TesseractOcrWorkerFactory(async () => ({ width: 200, height: 100 }))
      .create(['eng'], {}, () => {});

    await expect(worker.recognize(new Uint8Array([1]))).resolves.toEqual({
      text: 'ABC 123', confidence: 91,
      words: [{
        text: 'ABC', confidence: 90,
        boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      }],
    });
  });

  it('reinitializes languages and terminates the underlying worker', async () => {
    const engineWorker = makeWorker();
    createWorker.mockResolvedValue(engineWorker);
    const worker = await new TesseractOcrWorkerFactory().create(['eng'], {}, () => {});

    await worker.reinitialize(['fra', 'eng']);
    await worker.terminate();

    expect(engineWorker.reinitialize).toHaveBeenCalledWith('fra+eng', Tesseract.OEM.LSTM_ONLY);
    expect(engineWorker.terminate).toHaveBeenCalledTimes(1);
  });

  it('preserves a valid empty recognition result', async () => {
    const engineWorker = makeWorker();
    engineWorker.recognize.mockResolvedValue({ data: { text: '', confidence: 0 } });
    createWorker.mockResolvedValue(engineWorker);
    const worker = await new TesseractOcrWorkerFactory().create(['eng'], {}, () => {});

    await expect(worker.recognize(new Uint8Array([0]))).resolves.toEqual({ text: '', confidence: 0, words: [] });
  });
});
