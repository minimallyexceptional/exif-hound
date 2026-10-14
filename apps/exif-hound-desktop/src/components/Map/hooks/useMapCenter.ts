import { useState, useCallback } from 'react';
import { ImageData } from '../../../types';

export const useMapCenter = (selectedImage: ImageData | null, imagesWithLocation: ImageData[]) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getInitialCenter = useCallback((): [number, number] => {
    if (selectedImage?.exif.latitude != null && selectedImage?.exif.longitude != null) {
      return [selectedImage.exif.latitude, selectedImage.exif.longitude];
    }

    if (imagesWithLocation.length > 0) {
      return [
        imagesWithLocation[0].exif.latitude!,
        imagesWithLocation[0].exif.longitude!,
      ];
    }

    return [0, 0];
  }, [selectedImage, imagesWithLocation]);

  return {
    center: getInitialCenter(),
    isFullscreen,
    setIsFullscreen,
  };
};
