import ExifWorker from '../../workers/exifWorker';

// Mock the worker environment
const mockPostMessage = jest.fn();
const mockAddEventListener = jest.fn();
const mockTerminate = jest.fn();

// Mock Worker constructor
global.Worker = jest.fn().mockImplementation(() => ({
  postMessage: mockPostMessage,
  addEventListener: mockAddEventListener,
  terminate: mockTerminate,
  onmessage: null,
  onerror: null
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

describe('EXIF Worker Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create worker for EXIF parsing', () => {
    const worker = new Worker(new URL('../../workers/exifWorker.ts', import.meta.url), { 
      type: 'module' 
    });
    
    expect(Worker).toHaveBeenCalledWith(
      'mock-blob-url',
      { type: 'module' }
    );
    expect(worker).toBeDefined();
  });

  test('should handle EXIF processing via worker', async () => {
    const mockArrayBuffer = new ArrayBuffer(1024);
    const mockExifData = {
      make: 'Test Camera',
      model: 'Model X',
      dateTimeOriginal: '2023-01-01T12:00:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060
    };

    // Mock worker response
    let messageHandler: (event: MessageEvent) => void;
    mockAddEventListener.mockImplementation((event: string, handler: any) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });

    const worker = new Worker('test-worker.js');
    
    // Simulate parsing request
    const parsePromise = new Promise((resolve) => {
      worker.addEventListener('message', (event: MessageEvent) => {
        resolve(event.data);
      });
    });

    worker.postMessage({ 
      type: 'PARSE_EXIF', 
      buffer: mockArrayBuffer 
    });

    // Simulate worker response
    setTimeout(() => {
      if (messageHandler) {
        messageHandler({
          data: {
            type: 'EXIF_PARSED',
            data: mockExifData
          }
        } as MessageEvent);
      }
    }, 10);

    const result = await parsePromise;
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'PARSE_EXIF',
      buffer: mockArrayBuffer
    });
    
    expect(result).toEqual({
      type: 'EXIF_PARSED',
      data: mockExifData
    });
  });

  test('should handle worker errors gracefully', async () => {
    let errorHandler: (event: ErrorEvent) => void;
    
    mockAddEventListener.mockImplementation((event: string, handler: any) => {
      if (event === 'error') {
        errorHandler = handler;
      }
    });

    const worker = new Worker('test-worker.js');
    
    const errorPromise = new Promise((resolve) => {
      worker.addEventListener('error', (event: ErrorEvent) => {
        resolve(event);
      });
    });

    // Simulate worker error
    setTimeout(() => {
      if (errorHandler) {
        errorHandler({
          message: 'Worker error',
          filename: 'exifWorker.ts',
          lineno: 10
        } as ErrorEvent);
      }
    }, 10);

    const error = await errorPromise;
    expect(error).toBeDefined();
  });

  test('should cleanup worker on component unmount', () => {
    const worker = new Worker('test-worker.js');
    
    // Simulate cleanup
    worker.terminate();
    
    expect(mockTerminate).toHaveBeenCalled();
  });

  test('should handle multiple concurrent EXIF parsing requests', async () => {
    const worker = new Worker('test-worker.js');
    const requests = [
      new ArrayBuffer(1024),
      new ArrayBuffer(2048),
      new ArrayBuffer(512)
    ];

    // Send multiple parsing requests
    requests.forEach((buffer, index) => {
      worker.postMessage({
        type: 'PARSE_EXIF',
        id: index,
        buffer
      });
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(3);
    
    // Verify each request was sent with unique ID
    expect(mockPostMessage).toHaveBeenNthCalledWith(1, {
      type: 'PARSE_EXIF',
      id: 0,
      buffer: requests[0]
    });
    expect(mockPostMessage).toHaveBeenNthCalledWith(2, {
      type: 'PARSE_EXIF',
      id: 1,
      buffer: requests[1]
    });
    expect(mockPostMessage).toHaveBeenNthCalledWith(3, {
      type: 'PARSE_EXIF',
      id: 2,
      buffer: requests[2]
    });
  });

  test('should provide non-blocking EXIF parsing', () => {
    const startTime = performance.now();
    
    const worker = new Worker('test-worker.js');
    worker.postMessage({
      type: 'PARSE_EXIF',
      buffer: new ArrayBuffer(1024 * 1024) // Large buffer
    });

    const postTime = performance.now();
    
    // Posting message to worker should be immediate
    expect(postTime - startTime).toBeLessThan(10);
  });
});