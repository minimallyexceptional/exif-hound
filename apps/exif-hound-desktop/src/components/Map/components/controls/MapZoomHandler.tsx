import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { ImageData } from '../../../../types';
import { fixCoordinates } from '../../../../utils/diagnostics';

interface MapZoomHandlerProps {
  showRoute: boolean;
  images: ImageData[];
}

export const MapZoomHandler: React.FC<MapZoomHandlerProps> = ({ showRoute, images }) => {
  const map = useMap();

  useEffect(() => {
    if (showRoute && images.length > 1) {
      const points = images
        .map(image => {
          const coords = fixCoordinates(image.exif.latitude ?? null, image.exif.longitude ?? null);
          if (!coords) return null;
          const [lat, lng] = coords;
          return L.latLng(lat, lng);
        })
        .filter((point): point is L.LatLng => point !== null);

      if (points.length > 1) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 10,
          animate: true,
          duration: 1
        });
      }
    }
  }, [showRoute, images, map]);

  return null;
}; 