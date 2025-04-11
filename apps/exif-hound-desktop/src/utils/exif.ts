/**
 * EXIF utility functions for the desktop app
 */

import { extractExifData, formatExifMetadata, type ExifMetadata } from 'exif-middleware';
import { formatFileSize, formatDate, generateId } from 'shared-utils';

/**
 * Process an image file and extract EXIF data
 * @param file The image file to process
 * @returns Processed EXIF metadata
 */
export async function processImageFile(file: File): Promise<ExifMetadata> {
  try {
    // Read the file as an ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Extract EXIF data
    const metadata = await extractExifData(buffer);
    
    // Add file information
    metadata.fileName = file.name;
    metadata.fileSize = formatFileSize(file.size);
    metadata.fileType = file.type;
    metadata.fileId = generateId();
    
    // Add upload date
    metadata.uploadDate = new Date();
    
    return metadata;
  } catch (error) {
    console.error('Error processing image file:', error);
    return {
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: file.type,
      uploadDate: new Date(),
      fileId: generateId(),
      error: 'Failed to extract EXIF data'
    };
  }
}

/**
 * Format a date for display in the UI
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatExifDate(date: Date): string {
  return formatDate(date);
}

/**
 * Prepare EXIF data for display in the UI
 * @param metadata The EXIF metadata
 * @returns Formatted metadata for display
 */
export function prepareExifForDisplay(metadata: ExifMetadata): Record<string, string> {
  return formatExifMetadata(metadata);
} 