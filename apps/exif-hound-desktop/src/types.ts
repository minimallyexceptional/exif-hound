import { TileLayer } from 'leaflet';
import { LocationData } from './utils/geocoding';

export interface ExifData {
  latitude?: number | null;
  longitude?: number | null;
  dateTimeOriginal?: string | null;
  make?: string | null;
  model?: string | null;
  exposureTime?: string | null;
  fNumber?: number | null;
  iso?: number | null;
  focalLength?: number | null;
  error?: string | null;
  // New EXIF properties
  gpsAltitude?: number | null;
  gpsAltitudeRef?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  orientation?: number | null;
  software?: string | null;
  artist?: string | null;
  copyright?: string | null;
  description?: string | null;
  lensModel?: string | null;
  flash?: string | null;
  meteringMode?: string | null;
  whiteBalance?: string | null;
  imageDescription?: string | null;
  userComment?: string | null;
  // Location data from reverse geocoding
  location?: LocationData | null;
}

export interface ImageData {
  id: string;
  file: File;
  url: string;
  exif: ExifData;
  isProcessing?: boolean;
}

export interface MapStyle {
  id: string;
  name: string;
  url: string;
  attribution: string;
  preview: string;
}

export interface ImportData {
  type: 'kml' | 'csv';
  data: string;
}

export interface MapSettings {
  selectedStyle: string;
}