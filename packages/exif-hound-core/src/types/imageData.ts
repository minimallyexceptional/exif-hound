import type { LocationData } from './location';

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
  projectImageId?: number;
  url: string;
  file: ImageFile;
  exif: ExifData;
  isProcessing?: boolean;
}

export interface ImportData {
  type: 'kml' | 'csv';
  data: string;
  name?: string;
}
