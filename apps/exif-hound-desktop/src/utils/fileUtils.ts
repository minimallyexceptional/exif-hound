import { ImageData } from '../types';

declare global {
  interface Window {
    api: {
      readFile: (filePath: string) => Promise<ExifData | null>;
      getFileUrl: (filePath: string) => string;
      selectFiles: () => Promise<string[]>;
      selectExportDirectory: () => Promise<string | null>;
      getStoreValue: (key: string) => Promise<any>;
      setStoreValue: (key: string, value: unknown) => Promise<void>;
    };
  }
}

export async function readFile(filePath: string): Promise<ImageData | null> {
  try {
    const response = await window.api.readFile(filePath);
    if (!response) return null;

    // Convert base64 to blob
    const byteCharacters = atob(response.fileData.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: response.fileData.mimeType });
    const file = new File([blob], response.fileData.fileName, { type: response.fileData.mimeType });

    // Create object URL for the blob
    const url = URL.createObjectURL(blob);

    return {
      id: Math.random().toString(36).substring(7),
      file,
      url,
      exif: response.exif,
      isProcessing: false
    };
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
} 