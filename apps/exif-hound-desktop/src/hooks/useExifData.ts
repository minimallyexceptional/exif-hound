import { extractExifData, ExifMetadata } from 'exif-middleware';
import { ExifData } from '../types';
import { fixCoordinates } from '../utils/diagnostics';
import { getLocationFromCoordinates } from '../utils/geocoding';

interface UseExifDataOptions {
  onSuccess?: (data: ExifData) => void;
  onError?: (error: string) => void;
  fetchLocation?: boolean; // Option to enable/disable location fetching
}

/**
 * Converts middleware ExifMetadata to application ExifData format
 */
function convertMetadataToExifData(metadata: ExifMetadata, error?: string): ExifData {
  // Apply coordinate fixes if we have both latitude and longitude
  let latitude = metadata.latitude ?? null;
  let longitude = metadata.longitude ?? null;
  
  if (latitude !== null && longitude !== null) {
    // Apply diagnostic fixes for known coordinate issues
    const [fixedLat, fixedLng] = fixCoordinates(latitude, longitude);
    
    // Log if any fixes were applied
    if (fixedLat !== latitude || fixedLng !== longitude) {
      console.log(`[useExifData] Applied coordinate fixes for unknown file:`, {
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
    fNumber: metadata.fNumber ?? null,
    iso: metadata.iso ?? null,
    focalLength: metadata.focalLength ? parseFloat(metadata.focalLength) : null,
    error: error ?? null,
    gpsAltitude: metadata.altitude ?? null,
    gpsAltitudeRef: null, // Not provided by middleware
    imageWidth: metadata.dimensions?.width ?? null,
    imageHeight: metadata.dimensions?.height ?? null,
    orientation: null, // Not provided by middleware
    software: null, // Not provided by middleware
    artist: null, // Not provided by middleware
    copyright: null, // Not provided by middleware
    description: null, // Not provided by middleware
    lensModel: null, // Not provided by middleware
    flash: null, // Not provided by middleware
    meteringMode: null, // Not provided by middleware
    whiteBalance: null, // Not provided by middleware
    imageDescription: null, // Not provided by middleware
    userComment: null, // Not provided by middleware
    location: null, // Will be populated later if coordinates are valid
  };
}

export const useExifData = (options: UseExifDataOptions = {}) => {
  const processExifData = async (file: File): Promise<ExifData> => {
    try {
      // Convert File to ArrayBuffer for middleware
      const buffer = await file.arrayBuffer();
      
      // Use the middleware to extract EXIF data
      const metadata = await extractExifData(buffer);
      
      console.log('GPS Data from middleware for:', file.name, {
        latitude: metadata.latitude,
        longitude: metadata.longitude,
      });
      
      // Convert the middleware's metadata format to our app's ExifData format
      const exifData = convertMetadataToExifData(metadata);
      
      // If we have valid coordinates and location fetching is enabled, get location data
      if (options.fetchLocation !== false && 
          typeof exifData.latitude === 'number' && 
          typeof exifData.longitude === 'number') {
        try {
          console.log(`[useExifData] Fetching location data for: ${file.name}`);
          
          // Set initial loading state
          exifData.location = { loading: true };
          
          // Fetch location data asynchronously
          const locationData = await getLocationFromCoordinates(
            exifData.latitude, 
            exifData.longitude
          );
          
          console.log(`[useExifData] Location data received for: ${file.name}`, locationData);
          
          // Update with fetched location data
          exifData.location = locationData;
        } catch (locError) {
          console.error('Error fetching location data:', locError);
          exifData.location = { 
            loading: false, 
            error: 'Failed to fetch location data' 
          };
        }
      }
      
      options.onSuccess?.(exifData);
      return exifData;
    } catch (err) {
      const errorMessage = 'Failed to read EXIF data from image';
      console.error(errorMessage, err);
      options.onError?.(errorMessage);
      
      // Return empty ExifData with error message
      return convertMetadataToExifData({}, errorMessage);
    }
  };

  return { processExifData };
}; 