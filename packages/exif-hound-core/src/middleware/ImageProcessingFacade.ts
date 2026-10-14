import { ImageProcessingMiddleware } from 'image-processing-middleware';
import {
  configureImageProcessingWorker,
  createDefaultImageProcessingMiddleware,
  preprocessImageWithMiddleware,
} from './preprocessImage';

export class ImageProcessingFacade {
  private readonly middleware: ImageProcessingMiddleware;

  constructor(middleware?: ImageProcessingMiddleware) {
    this.middleware = middleware ?? createDefaultImageProcessingMiddleware();
  }

  configureWorker(moduleUrl: string): void {
    configureImageProcessingWorker(moduleUrl);
  }

  preprocessImage(
    imageId: number,
    imageName: string,
    sourceBytes: Uint8Array,
    onProgress: (progress: number, status: string) => void,
  ) {
    return preprocessImageWithMiddleware(this.middleware, imageId, imageName, sourceBytes, onProgress);
  }
}
