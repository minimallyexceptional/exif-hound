import React, { useEffect, useState } from 'react';
import { TileLayer, Circle, useMap, GeoJSON } from 'react-leaflet';
import { useSettings } from '../../../../context/SettingsContext';
import { MAP_STYLES } from '../../../../constants/mapStyles';
import { ImportedPoint, ImportedData } from '../../../../utils/importData';
import L from 'leaflet';
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

interface MapLayersProps {
  defaultLayer?: string;
  csvData?: ImportedPoint[];
  kmlData?: ImportedData;
}

export const MapLayers: React.FC<MapLayersProps> = ({ defaultLayer, csvData = [], kmlData }) => {
  const { mapSettings } = useSettings();
  const map = useMap();
  const [kmlGeoJSON, setKmlGeoJSON] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
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

  // Handle KML layer
  useEffect(() => {
    if (!map || !kmlData?.layer || !(kmlData.layer instanceof L.GeoJSON)) return;

    try {
      const geoJSON = kmlData.layer.toGeoJSON();
      
      // Ensure we have a FeatureCollection
      if ('features' in geoJSON) {
        setKmlGeoJSON(geoJSON as FeatureCollection<Geometry, GeoJsonProperties>);
      }

      // Fit bounds to show all KML features
      const bounds = kmlData.layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      console.error('Failed to process KML data:', error);
    }
  }, [kmlData, map]);

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    if (feature.properties && feature.properties.name) {
      layer.bindPopup(feature.properties.name);
    }
  };

  const style = {
    color: '#3b82f6',
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.2
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
      {kmlGeoJSON && (
        <GeoJSON
          data={kmlGeoJSON}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
    </>
  );
}; 