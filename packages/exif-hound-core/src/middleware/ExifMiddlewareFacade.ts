import {
  ExifMiddleware,
  extractExifData,
  formatDate,
  formatExifMetadata,
  formatFileSize,
  loadExifReaderTags,
  type ExifMetadata,
  type ExifMiddlewareOptions,
} from 'exif-middleware';

export class ExifMiddlewareFacade {
  readonly instance: ExifMiddleware;

  constructor(options: ExifMiddlewareOptions = {}) {
    this.instance = new ExifMiddleware(options);
  }

  extractExifData(buffer: ArrayBuffer): Promise<ExifMetadata> {
    return this.instance.extractExifData(buffer);
  }

  formatExifMetadata(metadata: ExifMetadata): Record<string, string> {
    return this.instance.formatExifMetadata(metadata);
  }

  formatFileSize(bytes: number, decimals?: number): string {
    return this.instance.formatFileSize(bytes, decimals);
  }

  formatDate(date: Date): string {
    return this.instance.formatDate(date);
  }

  loadExifReaderTags(buffer: ArrayBuffer, options?: { expanded?: boolean }) {
    return this.instance.loadExifReaderTags(buffer, options);
  }
}

export { extractExifData, formatDate, formatExifMetadata, formatFileSize, loadExifReaderTags, type ExifMetadata, type ExifMiddlewareOptions, ExifMiddleware } from 'exif-middleware';
