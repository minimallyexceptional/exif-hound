import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { ImageData } from '../../../../types';
import { fixCoordinates } from '../../../../utils/diagnostics';

interface HeatmapProps {
  images: ImageData[];
}

export const ImageHeatmap: React.FC<HeatmapProps> = ({ images }) => {
  const map = useMap();

  useEffect(() => {
    const points = images
      .map(image => {
        const coords = fixCoordinates(image.exif.latitude ?? null, image.exif.longitude ?? null);
        return coords ? [coords[0], coords[1], 1] : null;
      })
      .filter((point): point is [number, number, number] => point !== null);

    if (points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      max: 1.0,
      gradient: { 0.4: '#3b82f6', 0.65: '#22c55e', 1: '#ef4444' }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, images]);

  return null;
}; 