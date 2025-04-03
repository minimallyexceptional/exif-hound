interface ExifData {
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
}

interface FileData {
  base64: string;
  mimeType: string;
  fileName: string;
}

interface ReadFileResponse {
  exif: ExifData;
  fileData: FileData;
}

interface Window {
  api: {
    readFile: (filePath: string) => Promise<ReadFileResponse | null>;
    getFileUrl: (filePath: string) => string;
    selectFiles: () => Promise<string[]>;
    selectExportDirectory: () => Promise<string | null>;
    getStoreValue: (key: string) => Promise<any>;
    setStoreValue: (key: string, value: unknown) => Promise<void>;
  };
} 