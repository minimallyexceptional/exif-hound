// We'll use the browser APIs for file saving when Tauri is not available

// TypeScript declarations for Tauri globals
declare global {
  interface Window {
    __TAURI__?: {
      dialog?: Record<string, unknown>;
      fs?: Record<string, unknown>;
      [key: string]: unknown;
    };
    __TAURI_IPC__?: unknown;
  }
}

// TypeScript declarations for the File System Access API
interface FileSystemSaveOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(content: string): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    showSaveFilePicker(options?: FileSystemSaveOptions): Promise<FileSystemFileHandle>;
  }
}

// Helper function to wait for a specified time
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if we're running in a Tauri environment
 */
export function isTauriEnvironment(): boolean {
  try {
    if (typeof window === 'undefined') return false;

    // Tauri v2 always injects __TAURI_INTERNALS__ into its webview (the npm
    // APIs are built on it) — the reliable signal. window.__TAURI__ only
    // exists when app.withGlobalTauri is enabled, which this app does not
    // use, and __TAURI_IPC__ is a legacy global. See the identical check in
    // services/updater/UpdateBackend.ts.
    const win = window as unknown as {
      __TAURI_INTERNALS__?: unknown;
      __TAURI_IPC__?: unknown;
      __TAURI__?: unknown;
    };
    return !!(
      win.__TAURI_INTERNALS__ ??
      win.__TAURI_IPC__ ??
      win.__TAURI__
    );
  } catch (e) {
    console.error('[FileSystem] Error checking Tauri environment:', e);
    return false;
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'json': return 'application/json';
    case 'csv': return 'text/csv';
    case 'txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}

/**
 * Save content to a file using the File System Access API
 * If the browser doesn't support it, falls back to regular download
 */
async function saveFileWithDialog(
  content: string,
  filename: string,
  mimeType: string,
  fileExtension: string
): Promise<boolean> {
  // Check if File System Access API is supported
  if ('showSaveFilePicker' in window) {
    try {
      // Configure save dialog options
      const options: FileSystemSaveOptions = {
        suggestedName: filename,
        types: [{
          description: fileExtension.toUpperCase(),
          accept: {
            [mimeType]: [`.${fileExtension}`]
          }
        }]
      };

      // Show the save file picker
      const handle = await window.showSaveFilePicker(options);

      // Create a writable stream and write the content
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();

      return true;
    } catch (error: unknown) {
      // User cancelled or error occurred
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'AbortError'
      ) {
        return false;
      }
      console.error('[FileSystem] Error using File System Access API:', error);
      // Fall back to regular download
      return fallbackToDownload(content, filename, mimeType);
    }
  } else {
    return fallbackToDownload(content, filename, mimeType);
  }
}

/**
 * Fallback function to save a file using browser download
 */
async function fallbackToDownload(
  content: string,
  filename: string,
  mimeType: string
): Promise<boolean> {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('[FileSystem] Browser download error:', error);
    return false;
  }
}

/**
 * Save JSON content to a file
 * @param jsonContent The JSON content to save
 * @param defaultName Default file name
 */
export async function saveJsonFile(jsonContent: string, defaultName: string): Promise<boolean> {
  const filename = defaultName.endsWith('.json') ? defaultName : `${defaultName}.json`;
  return saveFileWithDialog(jsonContent, filename, getMimeType(filename), 'json');
}

/**
 * Save CSV content to a file
 * @param csvContent The CSV content to save
 * @param defaultName Default file name
 */
export async function saveCsvFile(csvContent: string, defaultName: string): Promise<boolean> {
  const filename = defaultName.endsWith('.csv') ? defaultName : `${defaultName}.csv`;
  return saveFileWithDialog(csvContent, filename, getMimeType(filename), 'csv');
}
