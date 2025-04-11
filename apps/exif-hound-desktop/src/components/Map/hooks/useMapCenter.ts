import { useState, useCallback } from 'react';
import { ImageData } from '../../../types';
import { fixCoordinates } from '../../../utils/diagnostics';

export const useMapCenter = (selectedImage: ImageData | null, imagesWithLocation: ImageData[]) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getInitialCenter = useCallback((): [number, number] => {
    try {
      if (selectedImage?.exif.latitude != null && selectedImage?.exif.longitude != null) {
        const coords = fixCoordinates(selectedImage.exif.latitude, selectedImage.exif.longitude);
        if (coords) return coords as [number, number];
      }
      
      if (imagesWithLocation.length > 0) {
        const coords = fixCoordinates(
          imagesWithLocation[0].exif.latitude!,
          imagesWithLocation[0].exif.longitude!
        );
        if (coords) return coords as [number, number];
      }
    } catch (error) {
      console.error('Error calculating map center:', error);
    }
    
    return [0, 0]; // Default center if no valid coordinates
  }, [selectedImage, imagesWithLocation]);

  return {
    center: getInitialCenter(),
    isFullscreen,
    setIsFullscreen
  };
}; 