import { useState, useEffect } from 'react';
import { ImageData } from '../../../types';
import { validateCoordinates } from '../utils/coordinateUtils';
import * as geolib from 'geolib';

export const useMapState = (images: ImageData[]) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Filter images to only include those with valid GPS coordinates
  const imagesWithLocation = images.filter(img => {
    const hasCoordinates = validateCoordinates(img.exif.latitude, img.exif.longitude);
    if (hasCoordinates) {
      return geolib.isValidCoordinate({
        latitude: img.exif.latitude!,
        longitude: img.exif.longitude!
      });
    }
    return false;
  });

  // Sort images by date for route drawing
  const sortedImages = [...imagesWithLocation].sort((a, b) => {
    const dateA = a.exif.dateTimeOriginal ? new Date(a.exif.dateTimeOriginal).getTime() : 0;
    const dateB = b.exif.dateTimeOriginal ? new Date(b.exif.dateTimeOriginal).getTime() : 0;
    return dateA - dateB;
  });

  // Create route coordinates
  const routeCoordinates = sortedImages
    .map(img => [img.exif.latitude!, img.exif.longitude!] as [number, number]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleImportModal = (show: boolean) => {
    setShowImportModal(show);
  };

  return {
    isFullscreen,
    showImportModal,
    imagesWithLocation,
    routeCoordinates,
    toggleFullscreen,
    toggleImportModal
  };
}; 