/**
 * EXIF Middleware
 * Utility functions for processing EXIF metadata
 */

import ExifReader from 'exifreader';
// Use relative path to avoid TypeScript path resolution issues during build
import { formatFileSize, formatDate } from '../../shared-utils/src';

export interface ExifMetadata {
  make?: string;
  model?: string;
  dateTaken?: Date;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: string;
  fileSize?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  [key: string]: any;
}

/**
 * Extract EXIF data from an image buffer
 * @param buffer The image buffer
 * @returns Processed EXIF metadata
 */
export async function extractExifData(buffer: ArrayBuffer): Promise<ExifMetadata> {
  try {
    const tags = ExifReader.load(buffer);
    
    const metadata: ExifMetadata = {};
    
    // Camera information
    if (tags.Make) metadata.make = tags.Make.description;
    if (tags.Model) metadata.model = tags.Model.description;
    
    // Date information
    if (tags.DateTimeOriginal) {
      const dateStr = tags.DateTimeOriginal.description;
      // Convert EXIF date format (YYYY:MM:DD HH:MM:SS) to JS Date
      const [datePart, timePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split(':').map(Number);
      const [hour, minute, second] = timePart.split(':').map(Number);
      metadata.dateTaken = new Date(year, month - 1, day, hour, minute, second);
    }
    
    // GPS information
    if (tags.GPSLatitude && tags.GPSLatitudeRef) {
      metadata.latitude = parseFloat(tags.GPSLatitude.description);
      if (tags.GPSLatitudeRef.description === 'S' && metadata.latitude !== undefined) {
        metadata.latitude = -metadata.latitude;
      }
    }
    
    if (tags.GPSLongitude && tags.GPSLongitudeRef) {
      metadata.longitude = parseFloat(tags.GPSLongitude.description);
      if (tags.GPSLongitudeRef.description === 'W' && metadata.longitude !== undefined) {
        metadata.longitude = -metadata.longitude;
      }
    }
    
    if (tags.GPSAltitude) {
      metadata.altitude = parseFloat(tags.GPSAltitude.description);
    }
    
    // Camera settings
    if (tags.ExposureTime) metadata.exposureTime = tags.ExposureTime.description;
    if (tags.FNumber) metadata.fNumber = parseFloat(tags.FNumber.description);
    if (tags.ISOSpeedRatings) metadata.iso = parseFloat(tags.ISOSpeedRatings.description);
    if (tags.FocalLength) metadata.focalLength = tags.FocalLength.description;
    
    // Image information
    if (tags.FileSize) {
      // Convert string or number to number before passing to formatFileSize
      const fileSizeValue = typeof tags.FileSize.value === 'string' 
        ? parseInt(tags.FileSize.value, 10) 
        : tags.FileSize.value;
        
      metadata.fileSize = formatFileSize(fileSizeValue);
    }
    
    if (tags.ImageWidth && tags.ImageHeight) {
      metadata.dimensions = {
        width: parseFloat(tags.ImageWidth.description),
        height: parseFloat(tags.ImageHeight.description)
      };
    }
    
    return metadata;
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return {};
  }
}

/**
 * Format EXIF metadata for display
 * @param metadata The EXIF metadata
 * @returns Formatted metadata ready for UI display
 */
export function formatExifMetadata(metadata: ExifMetadata): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  if (metadata.make || metadata.model) {
    formatted.camera = [metadata.make, metadata.model].filter(Boolean).join(' ');
  }
  
  if (metadata.dateTaken) {
    formatted.dateTaken = formatDate(metadata.dateTaken);
  }
  
  if (metadata.latitude !== undefined && metadata.longitude !== undefined) {
    formatted.location = `${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`;
  }
  
  if (metadata.exposureTime) {
    formatted.exposure = metadata.exposureTime;
  }
  
  if (metadata.fNumber) {
    formatted.aperture = `ƒ/${metadata.fNumber}`;
  }
  
  if (metadata.iso) {
    formatted.iso = `ISO ${metadata.iso}`;
  }
  
  if (metadata.focalLength) {
    formatted.focalLength = metadata.focalLength;
  }
  
  if (metadata.dimensions) {
    formatted.dimensions = `${metadata.dimensions.width} × ${metadata.dimensions.height}`;
  }
  
  if (metadata.fileSize) {
    formatted.fileSize = metadata.fileSize;
  }
  
  return formatted;
} 