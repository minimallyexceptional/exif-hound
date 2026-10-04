import { ExifData } from '../types';
import { ExifMetadata } from 'exif-middleware';
import { fixCoordinates } from '../utils/diagnostics';
import { getLocationFromCoordinates } from '../utils/geocoding';
import exifWorkerUrl from '../workers/exifWorker?worker&url';
import { convertMetadataToExifData } from '../utils/exifUtils';
import type { ExifWorkerMessage, ExifWorkerResponse } from '../workers/exifWorker';

interface UseExifDataOptions {
  onSuccess?: (data: ExifData) => void;
  onError?: (error: string) => void;
  fetchLocation?: boolean; // Option to enable/disable location fetching
}

let exifWorker: Worker | null = null;
let workerIdCounter = 0;
const pendingRequests = new Map<string, { resolve: (data: ExifMetadata) => void; reject: (error: Error) => void }>();

// Initialize worker
const initWorker = () => {
  if (!exifWorker) {
    exifWorker = new Worker(
      exifWorkerUrl,
      { type: 'module' }
    );

    exifWorker.onmessage = (event: MessageEvent<ExifWorkerResponse>) => {
      const { type, id, data, error } = event.data;
      const request = pendingRequests.get(id);

      if (request) {
        pendingRequests.delete(id);

        if (type === 'EXIF_PARSED') {
          request.resolve(data);
        } else if (type === 'EXIF_ERROR') {
          request.reject(new Error(error || 'Unknown worker error'));
        }
      }
    };

    exifWorker.onerror = (event) => {
      if (__DEV__) {
        console.error('EXIF Worker error:', event);
      }
      // Reject all pending requests
      pendingRequests.forEach(({ reject }) => {
        reject(new Error('Worker error'));
      });
      pendingRequests.clear();
    };
  }
  return exifWorker;
};

// Parse EXIF data using worker
const parseExifWithWorker = async (buffer: ArrayBuffer): Promise<ExifMetadata> => {
  const worker = initWorker();
  const id = `exif-${++workerIdCounter}`;

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });

    const message: ExifWorkerMessage = {
      type: 'PARSE_EXIF',
      id,
      buffer
    };

    worker.postMessage(message);
  });
};

export const useExifData = (options: UseExifDataOptions = {}) => {
  const processExifData = async (file: File): Promise<ExifData> => {
    try {
      // Convert File to ArrayBuffer for worker
      const buffer = await file.arrayBuffer();

      // Use worker to extract EXIF data (non-blocking)
      const metadata = await parseExifWithWorker(buffer);

      // Convert the metadata format to our app's ExifData format
      const exifData = convertMetadataToExifData(metadata, fixCoordinates);

      // Always set initial loading state for location
      if (options.fetchLocation !== false &&
          typeof exifData.latitude === 'number' &&
          typeof exifData.longitude === 'number') {
        exifData.location = { loading: true };

        // Fetch location data in background (don't await)
        getLocationFromCoordinates(exifData.latitude, exifData.longitude)
          .then(locationData => {
            // This would need to be handled by the caller to update state
            exifData.location = locationData;
          })
          .catch(locError => {
            if (__DEV__) {
              console.error('Error fetching location data:', locError);
            }
            exifData.location = {
              loading: false,
              error: 'Failed to fetch location data'
            };
          });
      }

      options.onSuccess?.(exifData);
      return exifData;
    } catch (err) {
      const errorMessage = 'Failed to read EXIF data from image';
      if (__DEV__) {
        console.error(errorMessage, err);
      }
      options.onError?.(errorMessage);

      // Return empty ExifData with error message
      return convertMetadataToExifData({}, fixCoordinates, errorMessage);
    }
  };

  // Cleanup function to terminate worker
  const cleanup = () => {
    if (exifWorker) {
      exifWorker.terminate();
      exifWorker = null;
      pendingRequests.clear();
    }
  };

  return { processExifData, cleanup };
};
