import { ExifMiddlewareFacade, type ExifMiddlewareOptions } from './ExifMiddlewareFacade';
import * as ocr from './OcrMiddlewareFacade';
import { ImageProcessingFacade } from './ImageProcessingFacade';
import {
  ImageForensicsMiddlewareFacade,
  type ImageForensicsMiddlewareOptions,
} from './ImageForensicsMiddlewareFacade';
import type { ImageProcessingMiddleware } from 'image-processing-middleware';

export interface MiddlewareNamespaceOptions {
  exif?: ExifMiddlewareOptions;
  imageProcessing?: ImageProcessingMiddleware;
  forensics?: ImageForensicsMiddlewareOptions;
}

export class MiddlewareNamespace {
  readonly exif: ExifMiddlewareFacade;
  readonly imageProcessing: ImageProcessingFacade;
  readonly imageForensics: ImageForensicsMiddlewareFacade;
  readonly ocr = ocr;

  constructor(options: MiddlewareNamespaceOptions = {}) {
    this.exif = new ExifMiddlewareFacade(options.exif);
    this.imageProcessing = new ImageProcessingFacade(options.imageProcessing);
    this.imageForensics = new ImageForensicsMiddlewareFacade(options.forensics);
  }
}
