import React from 'react';
import { Polyline } from 'react-leaflet';
import { ImageData } from '../../../../types';
import { fixCoordinates } from '../../../../utils/diagnostics';

interface ImageRouteProps {
  images: ImageData[];
  color?: string;
  weight?: number;
  opacity?: number;
  dashArray?: string;
}

export const ImageRoute: React.FC<ImageRouteProps> = ({ 
  images,
  color = '#3B82F6', // Default to blue-500
  weight = 3,
  opacity = 0.8,
  dashArray = '5, 10'
}) => {
  // Sort images by date
  const sortedImages = [...images].sort((a, b) => {
    const dateA = a.exif.dateTimeOriginal ? new Date(a.exif.dateTimeOriginal).getTime() : 0;
    const dateB = b.exif.dateTimeOriginal ? new Date(b.exif.dateTimeOriginal).getTime() : 0;
    return dateA - dateB;
  });

  // Create route coordinates from sorted images
  const positions = sortedImages.map(image => {
    const [lat, lng] = fixCoordinates(image.exif.latitude!, image.exif.longitude!) as [number, number];
    return [lat, lng] as [number, number];
  });

  if (positions.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight,
        opacity,
        dashArray
      }}
    />
  );
}; 