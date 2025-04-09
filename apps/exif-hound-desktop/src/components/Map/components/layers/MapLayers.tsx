import React from 'react';
import { TileLayer } from 'react-leaflet';

interface TileLayerConfig {
  name: string;
  attribution: string;
  url: string;
  maxZoom?: number;
  subdomains?: string[];
}

const TILE_LAYERS: TileLayerConfig[] = [
  {
    name: 'OpenStreetMap',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  }
];

interface MapLayersProps {
  defaultLayer?: string;
}

export const MapLayers: React.FC<MapLayersProps> = ({ defaultLayer = 'OpenStreetMap' }) => {
  const defaultLayerConfig = TILE_LAYERS.find(layer => layer.name === defaultLayer) || TILE_LAYERS[0];
  
  return (
    <TileLayer
      attribution={defaultLayerConfig.attribution}
      url={defaultLayerConfig.url}
      maxZoom={defaultLayerConfig.maxZoom}
      subdomains={defaultLayerConfig.subdomains}
    />
  );
}; 