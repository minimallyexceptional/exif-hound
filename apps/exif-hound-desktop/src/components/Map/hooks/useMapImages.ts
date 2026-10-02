import { useMemo } from 'react';
import { ImageData } from '../../../types';
import { fixCoordinates } from '../../../utils/diagnostics';

// Efficient coordinate validation using simple numeric bounds
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

export const useMapImages = (images: ImageData[]) => {
  // Memoize filtered and processed images with efficient validation
  const imagesWithLocation = useMemo(() => {
    return images.filter(img => {
      if (img.exif.latitude == null || img.exif.longitude == null) return false;
      
      // Ensure coordinates are numbers
      const lat = Number(img.exif.latitude);
      const lng = Number(img.exif.longitude);
      
      // Use efficient numeric bounds check instead of geolib
      if (!isValidCoordinate(lat, lng)) return false;
      
      // Apply hemisphere correction if needed
      const [correctedLat, correctedLng] = fixCoordinates(lat, lng);
      
      // Update the image with corrected coordinates
      if (correctedLat !== lat || correctedLng !== lng) {
        img.exif.latitude = correctedLat;
        img.exif.longitude = correctedLng;
      }
      
      return true;
    });
  }, [images]);

  // Memoize sorted images
  const sortedImages = useMemo(() => {
    return [...imagesWithLocation].sort((a, b) => {
      const dateA = a.exif.dateTimeOriginal ? new Date(a.exif.dateTimeOriginal).getTime() : 0;
      const dateB = b.exif.dateTimeOriginal ? new Date(b.exif.dateTimeOriginal).getTime() : 0;
      return dateA - dateB;
    });
  }, [imagesWithLocation]);

  // Precompute coordinate arrays for reuse by heatmap/route/markers
  const coordinateArrays = useMemo(() => {
    const coords = imagesWithLocation.map(img => [
      img.exif.latitude as number, 
      img.exif.longitude as number
    ]);
    
    return {
      allCoordinates: coords,
      // Pre-calculated bounds for map fitting
      bounds: coords.length > 0 ? {
        north: Math.max(...coords.map(c => c[0])),
        south: Math.min(...coords.map(c => c[0])),
        east: Math.max(...coords.map(c => c[1])),
        west: Math.min(...coords.map(c => c[1]))
      } : null
    };
  }, [imagesWithLocation]);

  return {
    imagesWithLocation,
    sortedImages,
    coordinateArrays
  };
}; 