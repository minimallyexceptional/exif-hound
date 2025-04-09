import React from 'react';
import { TileLayer, Circle } from 'react-leaflet';
import { useSettings } from '../../../../context/SettingsContext';
import { MAP_STYLES } from '../../../../constants/mapStyles';
import { ImportedPoint } from '../../../../utils/importData';

interface MapLayersProps {
  defaultLayer?: string;
  csvData?: ImportedPoint[];
}

export const MapLayers: React.FC<MapLayersProps> = ({ defaultLayer, csvData = [] }) => {
  const { mapSettings } = useSettings();
  const selectedStyle = MAP_STYLES.find(style => style.id === (mapSettings?.selectedStyle || defaultLayer)) || MAP_STYLES[0];
  
  // Use custom tiles if enabled, otherwise use selected style
  const tileConfig = mapSettings?.customTiles?.enabled
    ? {
        url: mapSettings.customTiles.url,
        attribution: '&copy; Custom Tile Server'
      }
    : selectedStyle;

  const renderCSVData = (data: ImportedPoint[]) => {
    return data.map((point, index) => {
      if (!point.exif.latitude || !point.exif.longitude) return null;
      
      return (
        <Circle
          key={`csv-${index}`}
          center={[point.exif.latitude, point.exif.longitude]}
          radius={3}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            weight: 1
          }}
        />
      );
    });
  };

  return (
    <>
      <TileLayer
        url={tileConfig.url}
        attribution={tileConfig.attribution}
        maxZoom={19}
        minZoom={0}
        subdomains={tileConfig.url.includes('{s}') ? ['a', 'b', 'c'] : []}
        detectRetina={true}
        crossOrigin=""
      />
      {csvData && renderCSVData(csvData)}
    </>
  );
}; 