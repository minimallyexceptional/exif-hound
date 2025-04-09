import React from 'react';
import { TileLayer } from 'react-leaflet';
import { useSettings } from '../../../../context/SettingsContext';
import { MAP_STYLES } from '../../../../constants/mapStyles';

interface MapLayersProps {
  defaultLayer?: string;
}

export const MapLayers: React.FC<MapLayersProps> = () => {
  const { mapSettings } = useSettings();
  const selectedStyle = MAP_STYLES.find(style => style.id === mapSettings.selectedStyle) || MAP_STYLES[0];
  
  // Use custom tiles if enabled, otherwise use selected style
  const tileConfig = mapSettings.customTiles.enabled
    ? {
        url: mapSettings.customTiles.url,
        attribution: '&copy; Custom Tile Server'
      }
    : selectedStyle;

  return (
    <TileLayer
      attribution={tileConfig.attribution}
      url={tileConfig.url}
      maxZoom={19}
      minZoom={0}
      subdomains={tileConfig.url.includes('{s}') ? ['a', 'b', 'c'] : []}
      detectRetina={true}
      crossOrigin=""
    />
  );
}; 