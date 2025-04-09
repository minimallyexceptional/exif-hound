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
  
  return (
    <TileLayer
      attribution={selectedStyle.attribution}
      url={selectedStyle.url}
      maxZoom={19}
      minZoom={0}
      subdomains={selectedStyle.id === 'classic' ? [] : ['a', 'b', 'c']}
      detectRetina={true}
      crossOrigin=""
    />
  );
}; 