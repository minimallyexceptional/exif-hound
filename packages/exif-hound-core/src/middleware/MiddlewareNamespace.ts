import { ExifMiddlewareFacade } from './ExifMiddlewareFacade';
import * as ocr from './OcrMiddlewareFacade';
import * as imageProcessing from './ImageProcessingMiddlewareFacade';
import * as imageForensics from './ImageForensicsMiddlewareFacade';

export class MiddlewareNamespace {
  readonly exif = new ExifMiddlewareFacade();
  readonly ocr = ocr;
  readonly imageProcessing = imageProcessing;
  readonly imageForensics = imageForensics;
}
