import { ImageData } from '../types';

export function generateJson(images: ImageData[]): string {
  const exportData = images.map(image => ({
    fileName: image.file.name,
    fileType: image.file.type,
    fileSize: image.file.size,
    lastModified: new Date(image.file.lastModified).toISOString(),
    exif: {
      dateTaken: image.exif.dateTimeOriginal,
      make: image.exif.make,
      model: image.exif.model,
      exposureTime: image.exif.exposureTime,
      fNumber: image.exif.fNumber,
      iso: image.exif.iso,
      focalLength: image.exif.focalLength,
      location: image.exif.latitude && image.exif.longitude
        ? {
            latitude: image.exif.latitude,
            longitude: image.exif.longitude,
            altitude: image.exif.gpsAltitude,
            altitudeRef: image.exif.gpsAltitudeRef
          }
        : null,
      dimensions: {
        width: image.exif.imageWidth,
        height: image.exif.imageHeight,
        orientation: image.exif.orientation
      },
      software: image.exif.software,
      artist: image.exif.artist,
      copyright: image.exif.copyright,
      description: image.exif.description,
      lensModel: image.exif.lensModel,
      flash: image.exif.flash,
      meteringMode: image.exif.meteringMode,
      whiteBalance: image.exif.whiteBalance,
      imageDescription: image.exif.imageDescription,
      userComment: image.exif.userComment,
      error: image.exif.error
    }
  }));

  return JSON.stringify(exportData, null, 2);
}

export function downloadJson(jsonContent: string, filename: string) {
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}