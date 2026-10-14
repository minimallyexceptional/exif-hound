import { extractExifData, type ExifMetadata } from 'exif-middleware';

export interface ExifWorkerMessage {
  type: 'PARSE_EXIF';
  id: string;
  buffer: ArrayBuffer;
}

export interface ExifWorkerResponse {
  type: 'EXIF_PARSED' | 'EXIF_ERROR';
  id: string;
  data?: ExifMetadata;
  error?: string;
}

self.onmessage = async (event: MessageEvent<ExifWorkerMessage>) => {
  const { type, id, buffer } = event.data;
  if (type !== 'PARSE_EXIF') return;
  try {
    const metadata = await extractExifData(buffer);
    const response: ExifWorkerResponse = { type: 'EXIF_PARSED', id, data: metadata };
    self.postMessage(response);
  } catch (error) {
    const response: ExifWorkerResponse = {
      type: 'EXIF_ERROR',
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(response);
  }
};

export type { ExifMetadata };
