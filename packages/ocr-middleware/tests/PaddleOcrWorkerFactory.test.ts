import { PaddleOcrWorkerFactory } from '../src/PaddleOcrWorkerFactory';

describe('PaddleOcrWorkerFactory', () => {
  it('loads local PP-OCRv6 model archives with the configured WASM path and maps line text', async () => {
    const engine = {
      predict: jest.fn().mockResolvedValue([{ items: [
        { text: 'VISIBLE TEXT', score: 0.9, poly: [] },
        { text: 'second line', score: 0.7, poly: [] },
      ] }]),
      dispose: jest.fn().mockResolvedValue(undefined),
    };
    const createEngine = jest.fn().mockResolvedValue(engine);
    const factory = new PaddleOcrWorkerFactory({
      detectionModelUrl: '/ocr/paddle/detection.tar',
      recognitionModelUrl: '/ocr/paddle/recognition.tar',
      wasmPaths: '/ocr/paddle/ort/',
      createEngine,
    });

    const worker = await factory.create(['eng'], jest.fn());
    await expect(worker.recognize(new Blob(['png'], { type: 'image/png' }))).resolves.toEqual({
      text: 'VISIBLE TEXT\nsecond line', confidence: 80, words: [],
    });
    expect(createEngine).toHaveBeenCalledWith(expect.objectContaining({
      ocrVersion: 'PP-OCRv6', worker: true,
      textDetectionModelAsset: { url: '/ocr/paddle/detection.tar' },
      textRecognitionModelAsset: { url: '/ocr/paddle/recognition.tar' },
      ortOptions: expect.objectContaining({ backend: 'wasm', wasmPaths: '/ocr/paddle/ort/', numThreads: 1 }),
    }));
    expect(engine.dispose).toHaveBeenCalledTimes(0);
    await worker.terminate();
    expect(engine.dispose).toHaveBeenCalledTimes(1);
  });

  it('does not invent word boxes from Paddle line boxes', async () => {
    const engine = {
      predict: jest.fn().mockResolvedValue([{ items: [{ text: 'line words', score: 0.8, poly: [{ x: 1, y: 2 }] }] }]),
      dispose: jest.fn().mockResolvedValue(undefined),
    };
    const factory = new PaddleOcrWorkerFactory({
      detectionModelUrl: '/det.tar', recognitionModelUrl: '/rec.tar', wasmPaths: '/ort/',
      createEngine: jest.fn().mockResolvedValue(engine),
    });
    const worker = await factory.create(['eng'], jest.fn());

    await expect(worker.recognize(new Blob(['image']))).resolves.toMatchObject({ words: [] });
  });

  it('rejects languages outside the bundled English model with a clear error', async () => {
    const factory = new PaddleOcrWorkerFactory({
      detectionModelUrl: '/det.tar', recognitionModelUrl: '/rec.tar', wasmPaths: '/ort/',
      createEngine: jest.fn(),
    });

    await expect(factory.create(['fra'], jest.fn())).rejects.toThrow(/English/i);
  });
});
