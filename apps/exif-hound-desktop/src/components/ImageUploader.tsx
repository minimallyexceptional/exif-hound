import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { ImageData } from '../types';
import ExifReader from 'exifreader';

interface Props {
  onImageUpload: (imageData: ImageData) => void;
  inputId?: string;
  hideDropZone?: boolean;
}

const ImageUploader: React.FC<Props> = ({ onImageUpload, inputId = 'fileInput', hideDropZone = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processExifData = async (file: File) => {
    try {
      const tags = await ExifReader.load(file);
      
      let latitude = null;
      let longitude = null;
      let error = null;
      
      if (tags.GPSLatitude?.description && tags.GPSLongitude?.description) {
        try {
          const latDesc = tags.GPSLatitude.description;
          const lonDesc = tags.GPSLongitude.description;
          // Safely access values with type checking
          const latRefTag = tags.GPSLatitudeRef;
          const lonRefTag = tags.GPSLongitudeRef;
          const latRef = latRefTag && typeof latRefTag.value === 'string' ? latRefTag.value[0] : 'N';
          const lonRef = lonRefTag && typeof lonRefTag.value === 'string' ? lonRefTag.value[0] : 'E';

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
          console.error('Error processing GPS coordinates:', err);
          error = 'Failed to process GPS coordinates';
          latitude = null;
          longitude = null;
        }
      } else {
        error = 'No GPS data found in image';
      }

      // Extract additional EXIF data with safe type checking
      const gpsAltitude = tags.GPSAltitude?.description ? parseFloat(tags.GPSAltitude.description) : null;
      const gpsAltitudeRef = tags.GPSAltitudeRef?.description || null;
      
      // Safely extract numeric values
      const imageWidth = typeof tags.ImageWidth?.value === 'number' 
        ? tags.ImageWidth.value 
        : Array.isArray(tags.ImageWidth?.value) 
          ? Number(tags.ImageWidth.value[0]) 
          : null;
          
      const imageHeight = typeof tags.ImageLength?.value === 'number' 
        ? tags.ImageLength.value 
        : Array.isArray(tags.ImageLength?.value) 
          ? Number(tags.ImageLength.value[0]) 
          : null;
          
      const orientation = typeof tags.Orientation?.value === 'number' 
        ? tags.Orientation.value 
        : Array.isArray(tags.Orientation?.value) 
          ? Number(tags.Orientation.value[0]) 
          : null;
          
      const software = tags.Software?.description || null;
      const artist = tags.Artist?.description || null;
      const copyright = tags.Copyright?.description || null;
      const description = tags.ImageDescription?.description || null;
      const lensModel = tags.LensModel?.description || null;
      const flash = tags.Flash?.description || null;
      const meteringMode = tags.MeteringMode?.description || null;
      const whiteBalance = tags.WhiteBalance?.description || null;
      const imageDescription = tags.ImageDescription?.description || null;
      // Use optional chaining and nullish coalescing for safety
      const userComment = typeof tags.UserComment === 'object' && tags.UserComment !== null 
        ? (tags.UserComment as any).description || null 
        : null;
      
      // Safely extract ISO value
      const iso = typeof tags.ISOSpeedRatings?.value === 'number' 
        ? tags.ISOSpeedRatings.value 
        : Array.isArray(tags.ISOSpeedRatings?.value) 
          ? Number(tags.ISOSpeedRatings.value[0]) 
          : null;

      return {
        latitude,
        longitude,
        dateTimeOriginal: tags.DateTimeOriginal?.description || null,
        make: tags.Make?.description || null,
        model: tags.Model?.description || null,
        exposureTime: tags.ExposureTime?.description || null,
        fNumber: tags.FNumber?.description ? parseFloat(tags.FNumber.description) : null,
        iso,
        focalLength: tags.FocalLength?.description ? parseFloat(tags.FocalLength.description) : null,
        error,
        // New EXIF properties
        gpsAltitude,
        gpsAltitudeRef,
        imageWidth,
        imageHeight,
        orientation,
        software,
        artist,
        copyright,
        description,
        lensModel,
        flash,
        meteringMode,
        whiteBalance,
        imageDescription,
        userComment
      };
    } catch (error) {
      console.error('Error reading EXIF data:', error);
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
        error: 'Failed to read EXIF data from image',
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

  const processFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          const exif = await processExifData(file);
          const url = URL.createObjectURL(file);
          onImageUpload({
            id: Math.random().toString(36).substring(7),
            file,
            url,
            exif,
            isProcessing: false
          });
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
    }
    setIsProcessing(false);
  }, [onImageUpload]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    await processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
    }
  }, [processFiles]);

  if (hideDropZone) {
    return (
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        id={inputId}
      />
    );
  }

  return (
    <div
      className={`border-2 border-dashed border-app-gray-light rounded-lg p-8 text-center cursor-pointer hover:border-app-white transition-colors ${
        isProcessing ? 'opacity-50 pointer-events-none' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        id={inputId}
      />
      <label htmlFor={inputId} className="cursor-pointer">
        <Upload className="w-12 h-12 mx-auto mb-4 text-app-accent-dim" />
        <p className="text-lg font-medium text-app-white">
          {isProcessing ? 'Processing images...' : 'Drop your images here or click to upload'}
        </p>
        <p className="text-sm text-app-accent-dim mt-2">
          Upload multiple images at once
        </p>
      </label>
    </div>
  );
};

export default ImageUploader;