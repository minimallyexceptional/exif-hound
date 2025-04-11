import { useMemo } from 'react';
import { ImageData } from '../../../../types';

export interface ProcessingInfo {
  software: string | null;
  originalDate: string | null;
  lastModified: string;
  hasBeenEdited: boolean;
  editingSoftware: string[];
  anomalies: string[];
}

export interface ProcessedImageData {
  image: ImageData;
  info: ProcessingInfo;
}

export const useProcessingData = (images: ImageData[]): ProcessedImageData[] => {
  return useMemo(() => {
    return images.map(img => {
      const info: ProcessingInfo = {
        software: img.exif.software || null,
        originalDate: img.exif.dateTimeOriginal || null,
        lastModified: new Date(img.file.lastModified).toISOString(),
        hasBeenEdited: false,
        editingSoftware: [],
        anomalies: []
      };

      // Check for editing software
      if (img.exif.software) {
        info.editingSoftware.push(img.exif.software);
      }

      // Check if image has been modified
      if (info.lastModified && info.originalDate) {
        const originalDate = new Date(info.originalDate);
        const modifyDate = new Date(info.lastModified);
        if (modifyDate.getTime() > originalDate.getTime()) {
          info.hasBeenEdited = true;
        }
      }

      // Check for metadata anomalies
      if (!img.exif.software && info.hasBeenEdited) {
        info.anomalies.push('Modified without software info');
      }
      if (!img.exif.dateTimeOriginal && info.lastModified) {
        info.anomalies.push('Missing original timestamp');
      }
      if (img.exif.software && !info.lastModified) {
        info.anomalies.push('Software present but no modification date');
      }

      return {
        image: img,
        info
      };
    });
  }, [images]);
}; 