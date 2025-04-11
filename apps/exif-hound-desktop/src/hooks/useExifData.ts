import { extractExifData } from 'exif-middleware';
import { ExifData } from '../types';
import { fixCoordinates } from '../utils/diagnostics';
import { getLocationFromCoordinates } from '../utils/geocoding';
import { convertMetadataToExifData } from '../utils/exifUtils';

interface UseExifDataOptions {
  onSuccess?: (data: ExifData) => void;
  onError?: (error: string) => void;
  fetchLocation?: boolean; // Option to enable/disable location fetching
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
      const exifData = convertMetadataToExifData(metadata, fixCoordinates);
      
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
      return convertMetadataToExifData({}, fixCoordinates, errorMessage);
    }
  };

  return { processExifData };
}; 