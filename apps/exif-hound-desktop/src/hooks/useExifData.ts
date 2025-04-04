import ExifReader from 'exifreader';
import { ExifData } from '../types';

interface UseExifDataOptions {
  onSuccess?: (data: ExifData) => void;
  onError?: (error: string) => void;
}

// Type guard to check if a tag has a description property
function hasDescription(tag: unknown): tag is { description: string } {
  return tag !== null && 
         typeof tag === 'object' && 
         'description' in (tag as object);
}

export const useExifData = (options: UseExifDataOptions = {}) => {
  const processExifData = async (file: File): Promise<ExifData> => {
    try {
      const tags = await ExifReader.load(file);
      
      let latitude = null;
      let longitude = null;
      let error = null;
      
      if (hasDescription(tags.GPSLatitude) && hasDescription(tags.GPSLongitude)) {
        try {
          const latDesc = tags.GPSLatitude.description;
          const lonDesc = tags.GPSLongitude.description;
          const latRef = tags.GPSLatitudeRef?.value?.[0] || 'N';
          const lonRef = tags.GPSLongitudeRef?.value?.[0] || 'E';

          latitude = parseFloat(latDesc);
          longitude = parseFloat(lonDesc);

          if (latRef === 'S') latitude = -latitude;
          if (lonRef === 'W') longitude = -longitude;

          if (isNaN(latitude) || isNaN(longitude)) {
            error = 'Invalid GPS coordinates found in image';
            latitude = null;
            longitude = null;
          }
        } catch (err) {
          error = 'Failed to process GPS coordinates';
          latitude = null;
          longitude = null;
        }
      } else {
        error = 'No GPS data found in image';
      }

      const exifData: ExifData = {
        latitude,
        longitude,
        dateTimeOriginal: hasDescription(tags.DateTimeOriginal) ? tags.DateTimeOriginal.description : null,
        make: hasDescription(tags.Make) ? tags.Make.description : null,
        model: hasDescription(tags.Model) ? tags.Model.description : null,
        exposureTime: hasDescription(tags.ExposureTime) ? tags.ExposureTime.description : null,
        fNumber: hasDescription(tags.FNumber) ? parseFloat(tags.FNumber.description) : null,
        iso: tags.ISOSpeedRatings?.value?.[0] || null,
        focalLength: hasDescription(tags.FocalLength) ? parseFloat(tags.FocalLength.description) : null,
        error,
        gpsAltitude: hasDescription(tags.GPSAltitude) ? parseFloat(tags.GPSAltitude.description) : null,
        gpsAltitudeRef: hasDescription(tags.GPSAltitudeRef) ? tags.GPSAltitudeRef.description : null,
        imageWidth: tags.ImageWidth?.value?.[0] || null,
        imageHeight: tags.ImageLength?.value?.[0] || null,
        orientation: tags.Orientation?.value?.[0] || null,
        software: hasDescription(tags.Software) ? tags.Software.description : null,
        artist: hasDescription(tags.Artist) ? tags.Artist.description : null,
        copyright: hasDescription(tags.Copyright) ? tags.Copyright.description : null,
        description: hasDescription(tags.ImageDescription) ? tags.ImageDescription.description : null,
        lensModel: hasDescription(tags.LensModel) ? tags.LensModel.description : null,
        flash: hasDescription(tags.Flash) ? tags.Flash.description : null,
        meteringMode: hasDescription(tags.MeteringMode) ? tags.MeteringMode.description : null,
        whiteBalance: hasDescription(tags.WhiteBalance) ? tags.WhiteBalance.description : null,
        imageDescription: hasDescription(tags.ImageDescription) ? tags.ImageDescription.description : null,
        userComment: hasDescription(tags.UserComment) ? tags.UserComment.description : null
      };

      options.onSuccess?.(exifData);
      return exifData;
    } catch (error) {
      const errorMessage = 'Failed to read EXIF data from image';
      options.onError?.(errorMessage);
      return {
        latitude: null,
        longitude: null,
        dateTimeOriginal: null,
        make: null,
        model: null,
        exposureTime: null,
        fNumber: null,
        iso: null,
        focalLength: null,
        error: errorMessage,
        gpsAltitude: null,
        gpsAltitudeRef: null,
        imageWidth: null,
        imageHeight: null,
        orientation: null,
        software: null,
        artist: null,
        copyright: null,
        description: null,
        lensModel: null,
        flash: null,
        meteringMode: null,
        whiteBalance: null,
        imageDescription: null,
        userComment: null
      };
    }
  };

  return { processExifData };
}; 