import { OpenCvImageEnhancer } from 'image-processing-middleware';
import type { RasterImage } from 'image-processing-middleware';

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<{ id: number; image: RasterImage; outputLimits?: { maxPixels: number; maxSide: number } }>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};
workerScope.onmessage = async (event: MessageEvent<{ id: number; image: RasterImage; outputLimits?: { maxPixels: number; maxSide: number } }>) => {
  const { id, image } = event.data;
  try {
    const result = await new OpenCvImageEnhancer().enhance({ ...image, data: new Uint8ClampedArray(image.data) }, progress => {
      workerScope.postMessage({ id, progress });
    }, event.data.outputLimits);
    workerScope.postMessage({ id, result }, [result.image.data.slice().buffer as ArrayBuffer]);
  } catch (error) {
    workerScope.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};

export {};
