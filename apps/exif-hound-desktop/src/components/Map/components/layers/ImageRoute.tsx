import React from 'react';
import { Polyline } from 'react-leaflet';
import { ImageData } from '../../../../types';
import { fixCoordinates } from '../../../../utils/diagnostics';

interface ImageRouteProps {
  images: ImageData[];
}

export const ImageRoute: React.FC<ImageRouteProps> = ({ images }) => {
  const routePoints = images
    .map(image => {
      const coords = fixCoordinates(image.exif.latitude ?? null, image.exif.longitude ?? null);
      return coords;
    })
    .filter((coord): coord is [number, number] => coord !== null);

  if (routePoints.length < 2) return null;

  return (
    <Polyline
      positions={routePoints}
      color="#ef4444"
      weight={3}
      opacity={0.7}
      dashArray="10, 10"
    />
  );
}; 