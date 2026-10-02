import { ImageData } from '../types';
import * as L from 'leaflet';
import * as omnivore from '@mapbox/leaflet-omnivore';

export interface ImportedPoint extends ImageData {
  hasImage: boolean;
}

export interface ImportedData {
  type: 'kml' | 'csv';
  data: string;
  layer?: L.Layer;
  points?: ImportedPoint[];
}

export function parseImportData(data: { type: 'kml' | 'csv', data: string }): Promise<ImportedData> {
  return new Promise((resolve, reject) => {
    try {
      if (data.type === 'kml') {
        // Parse KML data using omnivore with custom options to prevent default markers
        const kmlLayer = omnivore.kml.parse(data.data, {
          style: {
            pointToLayer: (feature, latlng) => {
              // Return null to prevent marker creation
              return null;
            }
          }
        } as any);
        resolve({
          type: 'kml',
          data: data.data,
          layer: kmlLayer
        });
      } else {
        // Parse CSV data
        const lines = data.data.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const validImages: ImportedPoint[] = [];
        
        lines.slice(1).forEach((line, index) => {
          const values = line.split(',');
          const row: Record<string, string> = {};
          
          headers.forEach((header, i) => {
            row[header] = values[i]?.trim() || '';
          });
          
          // Check if we have coordinates
          const lat = parseFloat(row['latitude']);
          const lon = parseFloat(row['longitude']);
          if (isNaN(lat) || isNaN(lon)) {
            return;
          }
          
          const imageUrl = row['url'] || row['image url'];
          
          validImages.push({
            id: Math.random().toString(36).substr(2, 9),
            url: imageUrl || '',
            hasImage: !!imageUrl,
            file: {
              name: row['file name'] || `Imported Point ${index + 1}`,
              type: row['file type'] || '',
              size: parseInt(row['file size (bytes)']) || 0,
              lastModified: Date.now()
            },
            exif: {
              latitude: lat,
              longitude: lon,
              dateTimeOriginal: row['date taken'] || new Date().toISOString(),
              make: row['make'] || '',
              model: row['model'] || '',
              exposureTime: row['exposure time'] || '',
              fNumber: row['f-number'] || '',
              iso: row['iso'] || '',
              focalLength: row['focal length'] ? parseFloat(row['focal length']) : null,
              gpsAltitude: parseFloat(row['gps altitude']),
              gpsAltitudeRef: row['gps altitude ref'] || '',
              imageWidth: parseInt(row['image width']),
              imageHeight: parseInt(row['image height']),
              orientation: parseInt(row['orientation']),
              software: row['software'] || '',
              artist: row['artist'] || '',
              copyright: row['copyright'] || '',
              description: row['description'] || '',
              lensModel: row['lens model'] || '',
              flash: row['flash'] || '',
              meteringMode: row['metering mode'] || '',
              whiteBalance: row['white balance'] || '',
              imageDescription: row['image description'] || '',
              userComment: row['user comment'] || ''
            }
          });
        });
        
        resolve({
          type: 'csv',
          data: data.data,
          points: validImages
        });
      }
    } catch (error) {
      reject(error);
    }
  });
} 