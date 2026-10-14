import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { ImageData } from '../../../../types';
interface HeatmapProps {
  images: ImageData[];
}

export const ImageHeatmap: React.FC<HeatmapProps> = ({ images }) => {
  const map = useMap();

  useEffect(() => {
    const points = images
      .map((image) => {
        const lat = image.exif.latitude;
        const lng = image.exif.longitude;
        if (lat == null || lng == null) return null;
        return [lat, lng, 1] as [number, number, number];
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