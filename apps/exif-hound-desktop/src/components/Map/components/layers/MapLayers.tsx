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
  // react-leaflet's <GeoJSON> ignores the `data` prop on updates (only `style`
  // is applied), so a new KML import would leave the old file's features on the
  // layer. Force a remount whenever we store a fresh FeatureCollection.
  const [geoJSONKey, setGeoJSONKey] = useState(0);
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
    if (!kmlData?.layer || !(kmlData.layer instanceof L.GeoJSON)) {
      setKmlGeoJSON(null);
      return;
    }

    try {
      const geoJSON = kmlData.layer.toGeoJSON();
      
      // Ensure we have a FeatureCollection
      if ('features' in geoJSON) {
        setGeoJSONKey(key => key + 1);
        setKmlGeoJSON(geoJSON as FeatureCollection<Geometry, GeoJsonProperties>);
      } else {
        setKmlGeoJSON(null);
      }

      // Fit bounds to show all KML features
      const bounds = kmlData.layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to process KML data:', error);
      setKmlGeoJSON(null);
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
          key={geoJSONKey}
          data={kmlGeoJSON}
          style={style}
          // Render point placemarks as circles (matching the CSV point style)
          // instead of Leaflet's default marker icons.
          pointToLayer={(feature, latlng) =>
            L.circleMarker(latlng, {
              radius: 3,
              color: style.color,
              fillColor: style.color,
              fillOpacity: style.fillOpacity,
              weight: style.weight
            })
          }
          onEachFeature={onEachFeature}
        />
      )}
    </>
  );
}; 