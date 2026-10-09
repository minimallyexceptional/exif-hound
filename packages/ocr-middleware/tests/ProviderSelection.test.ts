import { OcrMiddleware, OcrRequestOptions, OcrWorker, OcrWorkerFactory } from '../src';

const makePaddleFactory = () => {
  const worker: OcrWorker = {
    recognize: jest.fn().mockResolvedValue({ text: 'text from paddle', confidence: 87, words: [] }),
    reinitialize: jest.fn().mockResolvedValue(undefined),
    terminate: jest.fn().mockResolvedValue(undefined),
  };
  const factory = {
    engineVersion: 'PP-OCRv6_small',
    create: jest.fn().mockResolvedValue(worker),
  } as unknown as OcrWorkerFactory & { create: jest.Mock };
  return { factory, worker };
};

describe('OCR engine selection', () => {
  it('defaults to PaddleOCR and returns its attribution', async () => {
    const { factory } = makePaddleFactory();
    const middleware = new OcrMiddleware({ workerFactory: factory });

    await expect(middleware.recognize(new Uint8Array([1]))).resolves.toMatchObject({
      text: 'text from paddle', provider: 'paddle', engineVersion: 'PP-OCRv6_small',
    });
    expect(factory.create).toHaveBeenCalledWith(['eng'], expect.any(Function));
  });

  it('rejects an explicit request for the removed Tesseract provider', async () => {
    const { factory } = makePaddleFactory();
    const middleware = new OcrMiddleware({ workerFactory: factory });

    await expect(middleware.recognize(new Uint8Array([2]), { provider: 'tesseract' } as unknown as OcrRequestOptions))
      .rejects.toThrow(/Tesseract.*only supported provider/i);
    expect(factory.create).not.toHaveBeenCalled();
  });

  it('fails clearly when PaddleOCR is not configured with local runtime assets', async () => {
    const middleware = new OcrMiddleware();

    await expect(middleware.recognize(new Uint8Array([3])))
      .rejects.toThrow(/PaddleOCR.*not configured/i);
  });

  it('does not silently fall back when PaddleOCR fails to initialize', async () => {
    const { factory } = makePaddleFactory();
    factory.create.mockRejectedValue(new Error('model unavailable'));
    const middleware = new OcrMiddleware({ workerFactory: factory });

    await expect(middleware.recognize(new Uint8Array([4])))
      .rejects.toThrow(/PaddleOCR.*model unavailable/i);
  });
});
