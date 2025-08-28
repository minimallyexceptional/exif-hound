/**
 * EXIF Worker - Handles EXIF parsing in a separate thread to avoid blocking UI
 */
import { extractExifData } from 'exif-middleware';

export interface ExifWorkerMessage {
  type: 'PARSE_EXIF';
  id: string;
  buffer: ArrayBuffer;
}

export interface ExifWorkerResponse {
  type: 'EXIF_PARSED' | 'EXIF_ERROR';
  id: string;
  data?: any;
  error?: string;
}

// Worker message handler
self.onmessage = async (event: MessageEvent<ExifWorkerMessage>) => {
  const { type, id, buffer } = event.data;

  if (type === 'PARSE_EXIF') {
    try {
      // Use the middleware to extract EXIF data
      const metadata = await extractExifData(buffer);
      
      // Send success response
      const response: ExifWorkerResponse = {
        type: 'EXIF_PARSED',
        id,
        data: metadata
      };
      
      self.postMessage(response);
    } catch (error) {
      // Send error response
      const response: ExifWorkerResponse = {
        type: 'EXIF_ERROR',
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      self.postMessage(response);
    }
  }
};

// Export worker class for type checking (not used in worker context)
export default class ExifWorker extends Worker {
  constructor() {
    super(new URL('./exifWorker.ts', import.meta.url), { type: 'module' });
  }
}
