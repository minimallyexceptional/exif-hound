import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as omnivore from '@mapbox/leaflet-omnivore';
import * as L from 'leaflet';
import { KMLLayerProps } from '../../types';

export const KMLLayer: React.FC<KMLLayerProps> = ({ data, onLayerReady }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    console.log('Creating KML layer...');
    
    try {
      // Parse KML string directly
      const kmlLayer = omnivore.kml.parse(data);
      
      kmlLayer.on('ready', function() {
        console.log('KML layer ready');
        
        // Get the features and convert to GeoJSON
        const kmlFeatures = (kmlLayer as L.GeoJSON).toGeoJSON();
        if ('features' in kmlFeatures) {
          // Notify parent component that layer is ready
          onLayerReady?.(kmlFeatures.features);
          
          // Fit bounds if we have features
          if (kmlFeatures.features.length > 0) {
            const bounds = (kmlLayer as L.GeoJSON).getBounds();
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      });
      
      kmlLayer.on('error', function(e) {
        console.error('Error parsing KML:', e);
      });
    } catch (err) {
      console.error('Error creating KML layer:', err);
    }
  }, [map, data, onLayerReady]);
  
  return null;
}; 