import ExifReader from 'exifreader';
import fs from 'fs';

export interface GPSData {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

export interface ExifData {
  exif: {
    latitude: number | null;
    longitude: number | null;
    error: string | null;
    dateTimeOriginal: string | null;
    make: string | null;
    model: string | null;
    exposureTime: string | null;
    fNumber: number | null;
    iso: number | null;
    focalLength: number | null;
  };
  fileData: {
    base64: string;
    mimeType: string;
    fileName: string;
  };
}

export class ExifProcessor {
  public static async processImage(filePath: string): Promise<ExifData> {
    console.log('Processing image:', filePath);
    try {
      if (!fs.existsSync(filePath)) {
        console.error('File does not exist:', filePath);
        throw new Error('File does not exist');
      }

      const buffer = fs.readFileSync(filePath);
      console.log('File read successfully, size:', buffer.length);
      
      const tags = await ExifReader.load(buffer);
      console.log('EXIF tags loaded:', Object.keys(tags));
      
      const gpsData = this.extractGPSData(tags);
      const cameraData = this.extractCameraData(tags);
      
      const result = {
        exif: {
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          error: gpsData.error,
          dateTimeOriginal: tags.DateTimeOriginal?.description || null,
          make: cameraData.make,
          model: cameraData.model,
          exposureTime: cameraData.exposureTime,
          fNumber: cameraData.fNumber,
          iso: cameraData.iso,
          focalLength: cameraData.focalLength
        },
        fileData: {
          base64: buffer.toString('base64'),
          mimeType: 'image/jpeg',
          fileName: filePath.split('/').pop() || 'unknown'
        }
      };

      console.log('Processed image data:', result);
      return result;
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        exif: {
          latitude: null,
          longitude: null,
          error: 'Failed to process image',
          dateTimeOriginal: null,
          make: null,
          model: null,
          exposureTime: null,
          fNumber: null,
          iso: null,
          focalLength: null
        },
        fileData: {
          base64: '',
          mimeType: 'image/jpeg',
          fileName: 'unknown'
        }
      };
    }
  }

  private static extractGPSData(tags: ExifReader.Tags): GPSData {
    if (!tags.GPSLatitude?.description || !tags.GPSLongitude?.description) {
      return { latitude: null, longitude: null, error: null };
    }

    try {
      const latDesc = tags.GPSLatitude.description;
      const lonDesc = tags.GPSLongitude.description;
      const latRef = this.extractTagValue(tags.GPSLatitudeRef?.value, 'N');
      const lonRef = this.extractTagValue(tags.GPSLongitudeRef?.value, 'E');

      let latitude = parseFloat(latDesc);
      let longitude = parseFloat(lonDesc);

      if (latRef === 'S') latitude = -latitude;
      if (lonRef === 'W') longitude = -longitude;

      if (isNaN(latitude) || isNaN(longitude)) {
        return {
          latitude: null,
          longitude: null,
          error: 'Invalid GPS coordinates found in image'
        };
      }

      return { latitude, longitude, error: null };
    } catch (error) {
      console.error('Error processing GPS coordinates:', error);
      return {
        latitude: null,
        longitude: null,
        error: 'Failed to process GPS coordinates'
      };
    }
  }

  private static extractCameraData(tags: ExifReader.Tags) {
    return {
      make: this.extractTagValue(tags.Make?.value),
      model: this.extractTagValue(tags.Model?.value),
      exposureTime: tags.ExposureTime?.description || null,
      fNumber: tags.FNumber?.description ? parseFloat(tags.FNumber.description) : null,
      iso: this.extractTagValue(tags.ISOSpeedRatings?.value),
      focalLength: tags.FocalLength?.description ? parseFloat(tags.FocalLength.description) : null
    };
  }

  private static extractTagValue(value: any, defaultValue: any = null): any {
    if (!value) return defaultValue;
    if (Array.isArray(value)) return value[0];
    return value;
  }
} 