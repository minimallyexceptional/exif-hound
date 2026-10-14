import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { ImageData } from '../../../../types';
interface MapZoomHandlerProps {
  showRoute: boolean;
  images: ImageData[];
}

export const MapZoomHandler: React.FC<MapZoomHandlerProps> = ({ showRoute, images }) => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const updateZoomLevel = () => {
      container.dataset.zoomLevel = String(map.getZoom());
    };

    updateZoomLevel();
    map.on('zoomend', updateZoomLevel);
    return () => {
      map.off('zoomend', updateZoomLevel);
      delete container.dataset.zoomLevel;
    };
  }, [map]);

  useEffect(() => {
    if (showRoute && images.length > 1) {
      const points = images
        .map((image) => {
          const lat = image.exif.latitude;
          const lng = image.exif.longitude;
          if (lat == null || lng == null) return null;
          return L.latLng(lat, lng);
        })
        .filter((point): point is L.LatLng => point !== null);

      if (points.length > 1) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 1
        });
      }
    }
  }, [showRoute, images, map]);

  return null;
};
