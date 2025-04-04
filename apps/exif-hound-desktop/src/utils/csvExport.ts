import { ImageData } from '../types';

export function generateCsv(images: ImageData[]): string {
  // Define CSV headers
  const headers = [
    'File Name',
    'File Type',
    'File Size (bytes)',
    'Last Modified',
    'Date Taken',
    'Make',
    'Model',
    'Exposure Time',
    'F-Number',
    'ISO',
    'Focal Length',
    'Latitude',
    'Longitude',
    'GPS Altitude',
    'GPS Altitude Ref',
    'Image Width',
    'Image Height',
    'Orientation',
    'Software',
    'Artist',
    'Copyright',
    'Description',
    'Lens Model',
    'Flash',
    'Metering Mode',
    'White Balance',
    'Image Description',
    'User Comment'
  ];

  // Convert images to CSV rows
  const rows = images.map(image => [
    image.file.name,
    image.file.type,
    image.file.size,
    new Date(image.file.lastModified).toISOString(),
    image.exif.dateTimeOriginal || '',
    image.exif.make || '',
    image.exif.model || '',
    image.exif.exposureTime || '',
    image.exif.fNumber || '',
    image.exif.iso || '',
    image.exif.focalLength || '',
    image.exif.latitude || '',
    image.exif.longitude || '',
    image.exif.gpsAltitude || '',
    image.exif.gpsAltitudeRef || '',
    image.exif.imageWidth || '',
    image.exif.imageHeight || '',
    image.exif.orientation || '',
    image.exif.software || '',
    image.exif.artist || '',
    image.exif.copyright || '',
    image.exif.description || '',
    image.exif.lensModel || '',
    image.exif.flash || '',
    image.exif.meteringMode || '',
    image.exif.whiteBalance || '',
    image.exif.imageDescription || '',
    image.exif.userComment || ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape special characters and wrap in quotes if needed
      const cellStr = String(cell);
      return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')
        ? `"${cellStr.replace(/"/g, '""')}"`
        : cellStr;
    }).join(','))
  ].join('\n');

  return csvContent;
}

export function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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