import ExifReader from 'exifreader';
import { ExifData } from '../types';

interface UseExifDataOptions {
  onSuccess?: (data: ExifData) => void;
  onError?: (error: string) => void;
}

export const useExifData = (options: UseExifDataOptions = {}) => {
  const processExifData = async (file: File): Promise<ExifData> => {
    try {
      const tags = await ExifReader.load(file);
      
      let latitude = null;
      let longitude = null;
      let error = null;
      
      if (tags.GPSLatitude?.description && tags.GPSLongitude?.description) {
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
        dateTimeOriginal: tags.DateTimeOriginal?.description || null,
        make: tags.Make?.description || null,
        model: tags.Model?.description || null,
        exposureTime: tags.ExposureTime?.description || null,
        fNumber: tags.FNumber?.description ? parseFloat(tags.FNumber.description) : null,
        iso: tags.ISOSpeedRatings?.value?.[0] || null,
        focalLength: tags.FocalLength?.description ? parseFloat(tags.FocalLength.description) : null,
        error,
        gpsAltitude: tags.GPSAltitude?.description ? parseFloat(tags.GPSAltitude.description) : null,
        gpsAltitudeRef: tags.GPSAltitudeRef?.description || null,
        imageWidth: tags.ImageWidth?.value?.[0] || null,
        imageHeight: tags.ImageLength?.value?.[0] || null,
        orientation: tags.Orientation?.value?.[0] || null,
        software: tags.Software?.description || null,
        artist: tags.Artist?.description || null,
        copyright: tags.Copyright?.description || null,
        description: tags.ImageDescription?.description || null,
        lensModel: tags.LensModel?.description || null,
        flash: tags.Flash?.description || null,
        meteringMode: tags.MeteringMode?.description || null,
        whiteBalance: tags.WhiteBalance?.description || null,
        imageDescription: tags.ImageDescription?.description || null,
        userComment: tags.UserComment?.description || null
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