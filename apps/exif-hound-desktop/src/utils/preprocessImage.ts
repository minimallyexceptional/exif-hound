import workerUrl from '../workers/imageProcessingWorker?worker&url';
import { ImageProcessingError, ImageProcessingMiddleware, type ImageCodec, type ImageEnhancementResult, type RasterImage } from 'image-processing-middleware';

let worker: Worker | null = null;
let requestId = 0;
const pending = new Map<number, { resolve: (result: ImageEnhancementResult) => void; reject: (error: Error) => void; onProgress?: (progress: { progress: number; status: string }) => void }>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(workerUrl, { type: 'module' });
  worker.onmessage = (event: MessageEvent<{ id: number; result?: ImageEnhancementResult; error?: string; progress?: { progress: number; status: string } }>) => {
    const request = pending.get(event.data.id);
    if (!request) return;
    if (event.data.progress) { request.onProgress?.(event.data.progress); return; }
    pending.delete(event.data.id);
    if (event.data.error || !event.data.result) request.reject(new Error(event.data.error ?? 'Image processing failed.'));
    else request.resolve({ ...event.data.result, image: { ...event.data.result.image, data: new Uint8ClampedArray(event.data.result.image.data) } });
  };
  worker.onerror = () => {
    pending.forEach(({ reject }) => reject(new Error('The image processing worker stopped unexpectedly.')));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

const codec: ImageCodec = {
  async decode(sourceBytes: Uint8Array): Promise<RasterImage> {
    const ownedBytes = sourceBytes.slice().buffer as ArrayBuffer;
    const bitmap = await createImageBitmap(new Blob([ownedBytes]));
    try {
      if (bitmap.width > 10_000 || bitmap.height > 10_000 || bitmap.width * bitmap.height > 40_000_000) {
        throw new ImageProcessingError('The image exceeds the safe preprocessing limit (10,000px per side, 40,000,000 pixels).', 'resource-limit');
      }
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Could not create the image pixel buffer.');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      return { width: canvas.width, height: canvas.height, data: pixels.data };
    } finally {
      bitmap.close();
    }
  },
  async encodePng(image: RasterImage): Promise<Uint8Array> {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create the processed image encoder.');
    context.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG encoding failed.')), 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  },
};

const enhancer = {
  enhance(image: RasterImage, onProgress?: (progress: { progress: number; status: string }) => void, outputLimits?: { maxPixels: number; maxSide: number }): Promise<ImageEnhancementResult> {
    onProgress?.({ progress: 0.15, status: 'Enhancing image in background' });
    const id = ++requestId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject, onProgress });
      getWorker().postMessage({ id, image, outputLimits }, [image.data.buffer]);
    });
  },
};

const middleware = new ImageProcessingMiddleware(codec, enhancer);

export function preprocessImage(
  imageId: number,
  imageName: string,
  sourceBytes: Uint8Array,
  onProgress: (progress: number, status: string) => void,
) {
  return middleware.process({
    imageId, imageName, sourceBytes,
    onProgress: progress => onProgress(progress.progress, progress.status),
  });
}
