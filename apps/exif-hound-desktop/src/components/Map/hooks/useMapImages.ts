import { useMemo } from 'react';
import { ImageData } from '../../../types';
import * as geolib from 'geolib';

export const useMapImages = (images: ImageData[]) => {
  const imagesWithLocation = useMemo(() => {
    return images.filter(img => {
      try {
        if (img.exif.latitude == null || img.exif.longitude == null) return false;
        
        // Ensure coordinates are numbers
        const lat = Number(img.exif.latitude);
        const lng = Number(img.exif.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return false;
        
        // Final validation with geolib
        return geolib.isValidCoordinate({
          latitude: lat,
          longitude: lng
        });
      } catch (error) {
        console.error('Error validating coordinates:', error);
        return false;
      }
    });
  }, [images]);

  const sortedImages = useMemo(() => {
    return [...imagesWithLocation].sort((a, b) => {
      try {
        const dateA = a.exif.dateTimeOriginal ? new Date(a.exif.dateTimeOriginal).getTime() : 0;
        const dateB = b.exif.dateTimeOriginal ? new Date(b.exif.dateTimeOriginal).getTime() : 0;
        return dateA - dateB;
      } catch (error) {
        console.error('Error sorting images:', error);
        return 0;
      }
    });
  }, [imagesWithLocation]);

  return {
    imagesWithLocation,
    sortedImages
  };
}; 