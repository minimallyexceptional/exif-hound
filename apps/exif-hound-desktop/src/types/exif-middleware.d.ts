declare module 'exif-middleware' {
  export interface ExifMetadata {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    dateTaken?: Date;
    make?: string;
    model?: string;
    exposureTime?: string;
    fNumber?: string;
    iso?: string;
    focalLength?: string | number;
    dimensions?: {
      width: number;
      height: number;
    };
  }

  export function extractExifData(buffer: ArrayBuffer): Promise<ExifMetadata>;
} 