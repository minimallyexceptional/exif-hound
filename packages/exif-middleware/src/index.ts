/**
 * EXIF Middleware
 * Utility functions for processing EXIF metadata
 */

import ExifReader from 'exifreader';

/**
 * Format a file size in bytes to a human-readable string
 * (inlined from the former shared-utils package — its only remaining consumer)
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format a date for display
 * (inlined from the former shared-utils package)
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

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
 * Parses coordinates from EXIF data, handling different formats
 * @param coordinateStr The coordinate string from EXIF
 * @param isLongitude Whether this is a longitude value (helps with intelligent auto-correction)
 * @param direction Optional N, S, E, W direction if known separately
 * @returns Parsed coordinate as a decimal number
 */
function parseCoordinate(coordinateStr: string, isLongitude = false, direction?: string): number | undefined {
  try {
    // Check if the string already has a direction indicator
    const hasDirectionInStr = /[NSEW]$/i.test(coordinateStr.trim());
    
    // Some formats provide coordinates as decimal degrees
    if (!coordinateStr.includes("'") && !coordinateStr.includes('"')) {
      const value = parseFloat(coordinateStr);
      
      // If no direction in string but direction provided separately, apply it
      if (!hasDirectionInStr && direction) {
        const dir = direction.toUpperCase();
        if (dir === 'S' || dir === 'W') {
          return -Math.abs(value);
        } else if (dir === 'N' || dir === 'E') {
          return Math.abs(value);
        }
      }
      
      // Auto-correct common western hemisphere values if they're positive
      if (isLongitude && !direction && !hasDirectionInStr && value > 30 && value < 180) {
        console.warn(`Detected likely Western hemisphere longitude value without direction: ${value}`);
        console.warn(`Auto-correcting to negative value: ${-Math.abs(value)}`);
        return -Math.abs(value);
      }
      
      return value;
    }
    
    // Handle DMS format (degrees, minutes, seconds)
    // Example formats: "40 deg 42' 51.95\" N" or "40° 42' 51.95\" N"
    const dmsPattern = /(\d+)(?:°|\s*deg)?\s+(\d+)['′]?\s+(\d+(?:\.\d+)?)["″]?\s*([NSEW])?/i;
    const dmsMatch = coordinateStr.match(dmsPattern);
    
    if (dmsMatch) {
      const [, degrees, minutes, seconds, dirFromStr] = dmsMatch;
      let decimal = parseInt(degrees, 10) + parseInt(minutes, 10) / 60 + parseFloat(seconds) / 3600;
      
      // Use direction from string if available, otherwise use provided direction
      const finalDirection = dirFromStr || direction;
      
      // Apply the direction - Western and Southern hemispheres need negative coordinates
      if (finalDirection) {
        const dir = finalDirection.toUpperCase();
        if (dir === 'S' || dir === 'W') {
          decimal = -Math.abs(decimal);
          console.log(`Applied ${dir} direction to make coordinate negative: ${decimal}`);
        } else {
          decimal = Math.abs(decimal);
          console.log(`Applied ${dir} direction to keep coordinate positive: ${decimal}`);
        }
      } else if (isLongitude && decimal > 30 && decimal < 180) {
        // For longitude without direction, likely western hemisphere if in common range
        decimal = -Math.abs(decimal);
        console.warn(`No direction for likely western hemisphere longitude. Auto-correcting: ${decimal}`);
      }
      
      return decimal;
    }
    
    // Simple decimal degrees with no direction indicator
    const value = parseFloat(coordinateStr);
    
    // Auto-correct common western hemisphere values if they're positive
    if (isLongitude && !direction && !hasDirectionInStr && value > 30 && value < 180) {
      console.warn(`Detected likely Western hemisphere longitude value without direction: ${value}`);
      console.warn(`Auto-correcting to negative value: ${-Math.abs(value)}`);
      return -Math.abs(value);
    }
    
    return value;
  } catch (error) {
    console.error('Error parsing coordinate:', coordinateStr, error);
    return undefined;
  }
}

type GpsTag = {
  value?: unknown;
  description?: unknown;
};

/** Convert an ExifReader GPS rational/DMS tag to a signed decimal coordinate. */
function parseGpsCoordinate(coordinateTag: GpsTag, referenceTag: GpsTag, axis: 'latitude' | 'longitude'): number | undefined {
  const rawValue = coordinateTag.value;
  let decimal: number | undefined;

  if (Array.isArray(rawValue) && rawValue.length >= 3) {
    const parts = rawValue.slice(0, 3).map((part) => {
      if (Array.isArray(part) && part.length >= 2) {
        const numerator = Number(part[0]);
        const denominator = Number(part[1]);
        return denominator === 0 ? NaN : numerator / denominator;
      }
      return Number(part);
    });

    if (parts.every(Number.isFinite)) {
      decimal = parts[0] + parts[1] / 60 + parts[2] / 3600;
    }
  } else if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    decimal = rawValue;
  }

  // ExifReader exposes the machine-readable reference in `value`; descriptions
  // are human-readable (for example, "West longitude") and must not be matched
  // against "W"/"S" directly.
  const rawReference = referenceTag.value;
  const reference = Array.isArray(rawReference)
    ? rawReference.join('')
    : typeof rawReference === 'string'
      ? rawReference
      : typeof referenceTag.description === 'string'
        ? referenceTag.description.match(/[NSEW]/i)?.[0]
        : undefined;

  if (decimal === undefined && typeof coordinateTag.description === 'string') {
    decimal = parseCoordinate(coordinateTag.description, axis === 'longitude', reference);
  }

  if (decimal === undefined || !Number.isFinite(decimal)) return undefined;
  const normalizedReference = reference?.toUpperCase();
  if (normalizedReference === 'S' || normalizedReference === 'W') {
    decimal = -Math.abs(decimal);
  } else if (normalizedReference === 'N' || normalizedReference === 'E') {
    decimal = Math.abs(decimal);
  }

  const [min, max] = axis === 'latitude' ? [-90, 90] : [-180, 180];
  return decimal >= min && decimal <= max ? decimal : undefined;
}

/**
 * Extract EXIF data from an image buffer
 * @param buffer The image buffer
 * @returns Processed EXIF metadata
 */
export async function extractExifData(buffer: ArrayBuffer): Promise<ExifMetadata> {
  try {
    const tags = ExifReader.load(buffer);
    
    // Log all raw GPS data for debugging
    console.log('EXIF RAW GPS Data:', {
      GPSLatitude: tags.GPSLatitude,
      GPSLatitudeRef: tags.GPSLatitudeRef,
      GPSLongitude: tags.GPSLongitude,
      GPSLongitudeRef: tags.GPSLongitudeRef,
    });
    
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
    
    // GPSLatitude is always latitude and GPSLongitude is always longitude. Use
    // the raw rational values so minutes/seconds are not truncated by parsing a
    // display description, and apply the machine-readable hemisphere references.
    const latitude = tags.GPSLatitude && tags.GPSLatitudeRef
      ? parseGpsCoordinate(tags.GPSLatitude, tags.GPSLatitudeRef, 'latitude')
      : undefined;
    const longitude = tags.GPSLongitude && tags.GPSLongitudeRef
      ? parseGpsCoordinate(tags.GPSLongitude, tags.GPSLongitudeRef, 'longitude')
      : undefined;
    
    // Special handling for North American coordinates without proper references
    if (latitude !== undefined && longitude !== undefined) {
      // For debugging - log final coordinates
      console.log('Final coordinates:', { latitude, longitude });
    }
    
    metadata.latitude = latitude;
    metadata.longitude = longitude;
    
    // Handle altitude
    if (tags.GPSAltitude) {
      metadata.altitude = parseFloat(tags.GPSAltitude.description);
    }
    
    // Camera settings
    if (tags.ExposureTime) metadata.exposureTime = tags.ExposureTime.description;
    if (tags.FNumber) {
      // ExifReader describes this value as "f/8.0" for some cameras rather
      // than the bare number; parse the numeric component in either form.
      const fNumber = String(tags.FNumber.description).match(/-?\d+(?:\.\d+)?/);
      if (fNumber) metadata.fNumber = parseFloat(fNumber[0]);
    }
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
