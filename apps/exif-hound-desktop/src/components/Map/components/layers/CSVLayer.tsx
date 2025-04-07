import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { Feature, GeoJSON, Point } from 'geojson';
import { CSVLayerProps } from '../../types';

export const CSVLayer: React.FC<CSVLayerProps> = ({ data, onLayerReady }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    console.log('Creating CSV layer...');
    
    try {
      // Basic CSV validation
      const lines = data.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }
      
      // Extract and clean header row
      const rawHeaderRow = lines[0];
      const headerRow = rawHeaderRow.split(',').map(col => col.trim().toLowerCase());
      
      console.log('CSV Headers:', headerRow);
      
      // Find latitude and longitude columns
      const latitudeKeywords = ['latitude', 'lat', 'gps latitude'];
      const longitudeKeywords = ['longitude', 'lng', 'long', 'gps longitude'];
      
      let latIndex = -1;
      let lngIndex = -1;
      
      // First try exact matches
      for (let i = 0; i < headerRow.length; i++) {
        const col = headerRow[i];
        
        if (latIndex === -1 && latitudeKeywords.includes(col)) {
          latIndex = i;
        }
        
        if (lngIndex === -1 && longitudeKeywords.includes(col)) {
          lngIndex = i;
        }
      }
      
      // If no exact matches, try partial matches
      if (latIndex === -1 || lngIndex === -1) {
        for (let i = 0; i < headerRow.length; i++) {
          const col = headerRow[i];
          
          if (latIndex === -1 && latitudeKeywords.some(keyword => col.includes(keyword))) {
            latIndex = i;
          }
          
          if (lngIndex === -1 && longitudeKeywords.some(keyword => col.includes(keyword))) {
            lngIndex = i;
          }
        }
      }
      
      if (latIndex === -1 || lngIndex === -1) {
        throw new Error('Could not identify latitude and longitude columns');
      }
      
      console.log(`Found coordinate columns: Latitude (${latIndex}), Longitude (${lngIndex})`);
      
      // Convert CSV to GeoJSON
      const features: Feature<Point>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const columns = line.split(',').map(col => col.trim());
        
        if (columns.length !== headerRow.length) continue;
        
        const lat = parseFloat(columns[latIndex]);
        const lng = parseFloat(columns[lngIndex]);
        
        if (isNaN(lat) || isNaN(lng)) continue;
        
        const properties: Record<string, string> = {};
        
        headerRow.forEach((header, index) => {
          properties[header] = columns[index];
        });
        
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat] // GeoJSON uses [longitude, latitude]
          },
          properties
        });
      }
      
      if (features.length === 0) {
        throw new Error('No valid coordinates found in CSV');
      }
      
      console.log(`Created ${features.length} features from CSV`);
      
      // Create a GeoJSON layer
      const geoJsonObject: GeoJSON = {
        type: 'FeatureCollection',
        features
      };
      
      const geoJsonLayer = L.geoJSON(geoJsonObject, {
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 8,
            fillColor: '#ff7800',
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            let popupContent = '<table>';
            for (const key in feature.properties) {
              popupContent += `<tr><th>${key}</th><td>${feature.properties[key]}</td></tr>`;
            }
            popupContent += '</table>';
            layer.bindPopup(popupContent);
          }
        }
      });
      
      // Add layer to map
      geoJsonLayer.addTo(map);
      
      // Fit bounds to the layer
      if (features.length > 0) {
        map.fitBounds(geoJsonLayer.getBounds());
      }
      
      // Notify parent component that layer is ready
      onLayerReady?.(features);
      
    } catch (err) {
      console.error('Error creating CSV layer:', err);
    }
  }, [map, data, onLayerReady]);
  
  return null;
}; 