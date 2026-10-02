import { ExifMetadata } from 'exif-middleware';
import { ExifData } from '../types';

/**
 * Converts middleware ExifMetadata to application ExifData format
 */
export function convertMetadataToExifData(
  metadata: ExifMetadata, 
  fixCoordinatesFn: (lat: number | null, lng: number | null) => [number | null, number | null],
  error?: string
): ExifData {
  // Apply coordinate fixes if we have both latitude and longitude
  let latitude = metadata.latitude ?? null;
  let longitude = metadata.longitude ?? null;
  
  if (latitude !== null && longitude !== null) {
    // Apply diagnostic fixes for known coordinate issues
    const [fixedLat, fixedLng] = fixCoordinatesFn(latitude, longitude);
    
    // Log if any fixes were applied
    if (fixedLat !== latitude || fixedLng !== longitude) {
      console.log(`[exifUtils] Applied coordinate fixes:`, {
        from: { latitude, longitude },
        to: { latitude: fixedLat, longitude: fixedLng }
      });
    }
    
    latitude = fixedLat;
    longitude = fixedLng;
  }
  
  return {
    latitude,
    longitude,
    dateTimeOriginal: metadata.dateTaken ? metadata.dateTaken.toString() : null,
    make: metadata.make ?? null,
    model: metadata.model ?? null,
    exposureTime: metadata.exposureTime ?? null,
    fNumber: metadata.fNumber != null ? String(metadata.fNumber) : null,
    iso: metadata.iso != null ? String(metadata.iso) : null,
    focalLength: typeof metadata.focalLength === 'string' ? parseFloat(metadata.focalLength) : 
                 typeof metadata.focalLength === 'number' ? metadata.focalLength : null,
    error: error ?? null,
    gpsAltitude: metadata.altitude ?? null,
    gpsAltitudeRef: null,
    imageWidth: metadata.dimensions?.width ?? null,
    imageHeight: metadata.dimensions?.height ?? null,
    orientation: null,
    software: null,
    artist: null,
    copyright: null,
    description: null,
    lensModel: null,
    flash: null,
    meteringMode: null,
    whiteBalance: null,
    imageDescription: null,
    userComment: null,
    location: null,
  };
} 