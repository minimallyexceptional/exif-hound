import React from 'react';
import { TileLayer, LayersControl } from 'react-leaflet';

const { BaseLayer } = LayersControl;

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
  },
  {
    name: 'OpenTopoMap',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
    subdomains: ['a', 'b', 'c']
  },
  {
    name: 'Satellite',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19
  },
  {
    name: 'Dark Mode',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19
  }
];

interface MapLayersProps {
  defaultLayer?: string;
}

export const MapLayers: React.FC<MapLayersProps> = ({ defaultLayer = 'OpenStreetMap' }) => {
  return (
    <LayersControl position="topright">
      {TILE_LAYERS.map((layer) => (
        <BaseLayer 
          key={layer.name} 
          name={layer.name} 
          checked={layer.name === defaultLayer}
        >
          <TileLayer
            attribution={layer.attribution}
            url={layer.url}
            maxZoom={layer.maxZoom}
            subdomains={layer.subdomains}
          />
        </BaseLayer>
      ))}
    </LayersControl>
  );
}; 