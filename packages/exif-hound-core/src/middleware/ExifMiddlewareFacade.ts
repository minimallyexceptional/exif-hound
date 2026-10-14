import ExifReader from 'exifreader';
import {
  extractExifData,
  formatDate,
  formatExifMetadata,
  formatFileSize,
  type ExifMetadata,
} from 'exif-middleware';

export class ExifMiddlewareFacade {
  extractExifData(buffer: ArrayBuffer): Promise<ExifMetadata> {
    return extractExifData(buffer);
  }

  formatExifMetadata(metadata: ExifMetadata): Record<string, string> {
    return formatExifMetadata(metadata);
  }

  formatFileSize(bytes: number, decimals?: number): string {
    return formatFileSize(bytes, decimals);
  }

  formatDate(date: Date): string {
    return formatDate(date);
  }

  /** Load raw EXIF tags (e.g. embedded thumbnail) without exposing exifreader to the app. */
  async loadExifReaderTags(buffer: ArrayBuffer, options?: { expanded?: boolean }) {
    if (options?.expanded) {
      return ExifReader.load(buffer, { expanded: true });
    }
    return ExifReader.load(buffer);
  }
}

export type { ExifMetadata };
