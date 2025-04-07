import { Feature } from 'geojson';
import { ImportedLayer } from '../types';

export const createLayer = (
  type: 'kml' | 'csv',
  features: Feature[],
  nextId: number
): ImportedLayer => {
  return {
    id: `${type}-${nextId}`,
    name: `${type.toUpperCase()} Layer ${nextId}`,
    type,
    features,
    visible: true
  };
};

export const findCoordinateColumns = (headers: string[]): { latIndex: number; lonIndex: number } => {
  const latKeywords = ['lat', 'latitude', 'gps lat', 'gps latitude'];
  const lonKeywords = ['lon', 'long', 'longitude', 'gps long', 'gps longitude'];
  
  let latIndex = -1;
  let lonIndex = -1;
  
  // Try exact matches first
  headers.forEach((col, index) => {
    const colLower = col.toLowerCase().trim();
    
    if (latIndex === -1 && latKeywords.includes(colLower)) {
      latIndex = index;
    }
    
    if (lonIndex === -1 && lonKeywords.includes(colLower)) {
      lonIndex = index;
    }
  });
  
  // Try partial matches if no exact matches found
  if (latIndex === -1 || lonIndex === -1) {
    headers.forEach((col, index) => {
      const colLower = col.toLowerCase().trim();
      
      if (latIndex === -1) {
        const partialLatMatch = latKeywords.some(keyword => 
          colLower.includes(keyword) || keyword.includes(colLower)
        );
        if (partialLatMatch) latIndex = index;
      }
      
      if (lonIndex === -1) {
        const partialLonMatch = lonKeywords.some(keyword => 
          colLower.includes(keyword) || keyword.includes(colLower)
        );
        if (partialLonMatch) lonIndex = index;
      }
    });
  }
  
  return { latIndex, lonIndex };
};

export const validateKMLContent = (content: string): string | null => {
  if (!content.includes('<?xml')) {
    return 'Missing XML declaration';
  }
  if (!content.includes('<kml')) {
    return 'Missing KML root element';
  }
  if (!content.includes('<Placemark>')) {
    return 'No Placemark elements found in KML';
  }
  return null;
}; 