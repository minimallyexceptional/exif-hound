import { OcrMiddleware, OcrProgress } from '../src';

const recognized = { text: 'visible words', confidence: 93.4 };

const makeHarness = (result = recognized) => {
  const worker = {
    recognize: jest.fn().mockResolvedValue(result),
    reinitialize: jest.fn().mockResolvedValue(undefined),
    terminate: jest.fn().mockResolvedValue(undefined),
  };
  const workerFactory = {
    create: jest.fn().mockResolvedValue(worker),
  };
  return { worker, workerFactory };
};

describe('OcrMiddleware recognition', () => {
  it('recognizes local image bytes and returns text with confidence', async () => {
    const { worker, workerFactory } = makeHarness();
    const middleware = new OcrMiddleware({ workerFactory });
    const bytes = new Uint8Array([1, 2, 3]);

    await expect(middleware.recognize(bytes)).resolves.toEqual(recognized);
    expect(workerFactory.create).toHaveBeenCalledWith(['eng'], {}, expect.any(Function));
    expect(worker.recognize).toHaveBeenCalledWith(bytes);
  });

  it('accepts a Blob and treats an empty OCR result as success', async () => {
    const emptyResult = { text: '', confidence: 0 };
    const { worker, workerFactory } = makeHarness(emptyResult);
    const middleware = new OcrMiddleware({ workerFactory });
    const image = new Blob([new Uint8Array([4, 5])], { type: 'image/png' });

    await expect(middleware.recognize(image)).resolves.toEqual(emptyResult);
    expect(worker.recognize).toHaveBeenCalledWith(image);
  });

  it('keeps confidence within the documented 0 to 100 range', async () => {
    const { workerFactory } = makeHarness({ text: 'text', confidence: 121 });
    const middleware = new OcrMiddleware({ workerFactory });

    await expect(middleware.recognize(new Uint8Array([1]))).resolves.toEqual({ text: 'text', confidence: 100 });
  });

  it('uses configured language codes', async () => {
    const { workerFactory } = makeHarness();
    const middleware = new OcrMiddleware({ languages: ['spa', 'eng'], workerFactory });

    await middleware.recognize(new Uint8Array([1]));

    expect(workerFactory.create).toHaveBeenCalledWith(['spa', 'eng'], {}, expect.any(Function));
  });

  it('passes recognition failures to the caller', async () => {
    const failure = new Error('bad image');
    const { worker, workerFactory } = makeHarness();
    worker.recognize.mockRejectedValue(failure);
    const middleware = new OcrMiddleware({ workerFactory });

    await expect(middleware.recognize(new Uint8Array([0]))).rejects.toBe(failure);
  });

  it('reuses one worker for sequential recognition requests', async () => {
    const { workerFactory } = makeHarness();
    const middleware = new OcrMiddleware({ workerFactory });

    await middleware.recognize(new Uint8Array([1]));
    await middleware.recognize(new Uint8Array([2]));

    expect(workerFactory.create).toHaveBeenCalledTimes(1);
  });

  it('reinitializes a reused worker when the requested languages change', async () => {
    const { worker, workerFactory } = makeHarness();
    const middleware = new OcrMiddleware({ workerFactory });

    await middleware.recognize(new Uint8Array([1]));
    await middleware.recognize(new Uint8Array([2]), { languages: ['fra', 'eng'] });

    expect(workerFactory.create).toHaveBeenCalledTimes(1);
    expect(worker.reinitialize).toHaveBeenCalledWith(['fra', 'eng']);
  });

  it('normalizes engine progress and forwards it to the request callback', async () => {
    const { worker, workerFactory } = makeHarness();
    let reportProgress: (progress: OcrProgress) => void = () => {};
    workerFactory.create.mockImplementation(async (_languages, _options, onProgress) => {
      reportProgress = onProgress;
      return worker;
    });
    const middleware = new OcrMiddleware({ workerFactory });
    const onProgress = jest.fn();
    worker.recognize.mockImplementation(async () => {
      reportProgress({ status: 'recognizing text', progress: 1.4 });
      return recognized;
    });

    await middleware.recognize(new Uint8Array([1]), { onProgress });

    expect(onProgress).toHaveBeenCalledWith({ status: 'recognizing text', progress: 1 });
  });

  it('serializes concurrent requests and keeps their progress callbacks separate', async () => {
    const { worker, workerFactory } = makeHarness();
    let reportProgress: (progress: OcrProgress) => void = () => {};
    workerFactory.create.mockImplementation(async (_languages, _options, onProgress) => {
      reportProgress = onProgress;
      return worker;
    });
    const middleware = new OcrMiddleware({ workerFactory });
    const firstProgress = jest.fn();
    const secondProgress = jest.fn();
    let finishFirst: ((result: typeof recognized) => void) | undefined;
    worker.recognize
      .mockImplementationOnce(() => new Promise(resolve => {
        finishFirst = resolve;
        reportProgress({ status: 'first image', progress: 0.5 });
      }))
      .mockImplementationOnce(async () => {
        reportProgress({ status: 'second image', progress: 0.8 });
        return recognized;
      });

    const first = middleware.recognize(new Uint8Array([1]), { onProgress: firstProgress });
    const second = middleware.recognize(new Uint8Array([2]), { onProgress: secondProgress });
    await Promise.resolve();
    await Promise.resolve();
    expect(worker.recognize).toHaveBeenCalledTimes(1);
    finishFirst?.(recognized);
    await Promise.all([first, second]);

    expect(workerFactory.create).toHaveBeenCalledTimes(1);
    expect(firstProgress).toHaveBeenCalledWith({ status: 'first image', progress: 0.5 });
    expect(secondProgress).toHaveBeenCalledWith({ status: 'second image', progress: 0.8 });
    expect(firstProgress).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'second image' }));
  });

  it('terminates the worker on dispose and rejects future work', async () => {
    const { worker, workerFactory } = makeHarness();
    const middleware = new OcrMiddleware({ workerFactory });
    await middleware.recognize(new Uint8Array([1]));

    await middleware.dispose();

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    await expect(middleware.recognize(new Uint8Array([2]))).rejects.toThrow(/disposed/i);
  });

  it('does not create a worker when disposed before recognition', async () => {
    const { workerFactory } = makeHarness();
    const middleware = new OcrMiddleware({ workerFactory });

    await middleware.dispose();

    expect(workerFactory.create).not.toHaveBeenCalled();
    await expect(middleware.recognize(new Uint8Array([1]))).rejects.toThrow(/disposed/i);
  });

  it('forwards configured Tesseract resource paths to worker creation', async () => {
    const { workerFactory } = makeHarness();
    const workerOptions = { workerPath: '/assets/worker.js', corePath: '/assets/core' };
    const middleware = new OcrMiddleware({ workerFactory, workerOptions });

    await middleware.recognize(new Uint8Array([1]));

    expect(workerFactory.create).toHaveBeenCalledWith(['eng'], workerOptions, expect.any(Function));
  });
});
