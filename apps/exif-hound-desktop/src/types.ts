import { LocationData } from './utils/geocoding';

export interface ExifData {
  latitude?: number | null;
  longitude?: number | null;
  dateTimeOriginal?: string | null;
  make?: string | null;
  model?: string | null;
  exposureTime?: string | null;
  fNumber?: string | null;
  iso?: string | null;
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

export interface ImageFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
}

export interface ImageData {
  id: string;
  url: string;
  file: ImageFile;
  exif: {
    latitude?: number;
    longitude?: number;
    dateTimeOriginal?: string;
    make?: string;
    model?: string;
    exposureTime?: string;
    fNumber?: string;
    iso?: string;
    focalLength?: string;
    gpsAltitude?: number;
    gpsAltitudeRef?: string;
    imageWidth?: number;
    imageHeight?: number;
    orientation?: number;
    software?: string;
    artist?: string;
    copyright?: string;
    description?: string;
    lensModel?: string;
    flash?: string;
    meteringMode?: string;
    whiteBalance?: string;
    imageDescription?: string;
    userComment?: string;
  };
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
  customTiles: {
    enabled: boolean;
    url: string;
  };
}