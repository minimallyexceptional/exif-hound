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
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if we're running in a Tauri environment
 */
function isTauriEnvironment(): boolean {
  try {
    // Detailed debugging of the window and available objects
    console.log('[FileSystem] Window object keys:', Object.keys(window));
    console.log('[FileSystem] navigator.userAgent:', navigator.userAgent);
    
    if (window.__TAURI__) {
      console.log('[FileSystem] __TAURI__ available with keys:', Object.keys(window.__TAURI__));
    } else {
      console.log('[FileSystem] __TAURI__ is not available on window');
    }
    
    if (window.__TAURI_IPC__) {
      console.log('[FileSystem] __TAURI_IPC__ is available');
    } else {
      console.log('[FileSystem] __TAURI_IPC__ is not available on window');
    }
    
    // Multiple ways to detect Tauri environment
    const checks = [
      // Check 1: window.__TAURI__ existence (most common)
      typeof window !== 'undefined' && window.__TAURI__ !== undefined,
      
      // Check 2: Tauri IPC object (reliable in v2)
      typeof window !== 'undefined' && window.__TAURI_IPC__ !== undefined,
      
      // Check 3: Look for Tauri in user agent (sometimes available in v2)
      typeof navigator !== 'undefined' && /Tauri/.test(navigator.userAgent)
    ];
    
    // If any check passes, we're in a Tauri environment
    const result = checks.some(check => check === true);
    console.log('[FileSystem] Tauri environment detection checks:', checks);
    console.log('[FileSystem] Final Tauri environment detection:', result);
    return result;
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
      
      console.log(`[FileSystem] File saved via File System Access API: ${filename}`);
      return true;
    } catch (error: unknown) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[FileSystem] User cancelled file save');
        return false;
      }
      console.error('[FileSystem] Error using File System Access API:', error);
      // Fall back to regular download
      return fallbackToDownload(content, filename, mimeType);
    }
  } else {
    console.log('[FileSystem] File System Access API not supported, using fallback');
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
    console.log(`[FileSystem] File downloaded via browser: ${filename}`);
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