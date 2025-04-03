import { app, BrowserWindow, ipcMain, dialog, protocol, session } from 'electron';
import type { IpcMainInvokeEvent, OpenDialogOptions, SaveDialogOptions, OpenDialogReturnValue, SaveDialogReturnValue } from 'electron';
import path from 'path';
import Store from 'electron-store';
import ExifReader from 'exifreader';
import fs from 'fs';
import net from 'net';

// Register custom protocol
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'exifhound',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      allowServiceWorkers: true,
      corsEnabled: true
    }
  },
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      allowServiceWorkers: true,
      corsEnabled: true
    }
  }
]);

// Disable GPU acceleration and cache
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-features', 'NetworkService,OutOfBlinkCors');
app.commandLine.appendSwitch('disable-http-cache');

// Configure app paths
const userDataPath = path.join(app.getPath('appData'), 'Exif-Hound');
const cachePath = path.join(userDataPath, 'Cache');

// Ensure directories exist with error handling
try {
  require('fs').mkdirSync(userDataPath, { recursive: true });
  require('fs').mkdirSync(cachePath, { recursive: true });
} catch (error) {
  console.error('Error creating directories:', error);
}

// Set paths
app.setPath('userData', userDataPath);
app.setPath('sessionData', userDataPath);
app.setPath('cache', cachePath);

const store = new Store();

// Global reference to mainWindow to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
let customSession: Electron.Session | undefined;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      session: customSession,
      devTools: process.env.NODE_ENV === 'development'
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a1a'
  });

  // Set app user model id for Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.exifhound.app');
  }

  // Load the index.html from the Vite dev server in development
  // or from the dist folder in production
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow?.loadURL(process.env.VITE_DEV_SERVER_URL).catch(console.error);
    // Only open DevTools if explicitly requested
    if (process.env.OPEN_DEVTOOLS === 'true') {
      mainWindow?.webContents.openDevTools();
    }
  } else {
    mainWindow?.loadFile(path.join(__dirname, '../dist/index.html')).catch(console.error);
  }

  // Enable file protocol for loading local files
  mainWindow.webContents.session.protocol.registerFileProtocol('file', (request: { url: string }, callback: (response: { path: string }) => void) => {
    const filePath = decodeURIComponent(request.url.slice('file://'.length));
    // Ensure the file exists and is accessible
    try {
      require('fs').accessSync(filePath);
      callback({ path: filePath });
    } catch (error) {
      console.error('Error accessing file:', error);
      callback({ path: '' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize the app
app.whenReady().then(() => {
  // Configure session with CSP
  customSession = session.fromPartition('persist:exifhound');
  
  // Register custom protocol handler
  customSession.protocol.registerFileProtocol('exifhound', (request: { url: string }, callback: (response: { path: string }) => void) => {
    const url = request.url.substr('exifhound://'.length);
    callback({ path: path.normalize(`${__dirname}/../${url}`) });
  });

  protocol.handle('app', async (request: { url: string }) => {
    const filePath = path.join(__dirname, '..', request.url.slice('app://'.length));
    return new Response(fs.readFileSync(filePath));
  });

  const csp = [
    "default-src 'self' exifhound:",
    "script-src 'self' exifhound: 'unsafe-inline' 'unsafe-eval'",
    "img-src 'self' exifhound: data: blob: https://a.tile.openstreetmap.org https://a.tile.openstreetmap.fr https://a.tile.opentopomap.org",
    "media-src 'self' exifhound: data: blob:",
    "connect-src 'self' exifhound: https://a.tile.openstreetmap.org https://a.tile.openstreetmap.fr https://a.tile.opentopomap.org",
    "style-src 'self' exifhound: 'unsafe-inline'",
    "worker-src 'self' blob:"
  ].join('; ');

  customSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': csp
      }
    });
  });

  // Ensure temp directory exists
  require('fs').mkdirSync(userDataPath, { recursive: true });
  
  createWindow();

  // Only create new window on activate if no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(console.error);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up temp directory on quit
app.on('quit', () => {
  try {
    require('fs').rmSync(userDataPath, { recursive: true, force: true });
  } catch (error) {
    console.error('Error cleaning up temp directory:', error);
  }
});

// IPC Handlers for file operations
ipcMain.handle('select-files', async (): Promise<string[]> => {
  if (!mainWindow) return [];
  
  const options: OpenDialogOptions = {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ]
  };

  try {
    const result = (await dialog.showOpenDialog(mainWindow, options)) as unknown as OpenDialogReturnValue;
    return result.canceled ? [] : result.filePaths;
  } catch (error) {
    console.error('Error selecting files:', error);
    return [];
  }
});

ipcMain.handle('select-export-directory', async (): Promise<string | null> => {
  if (!mainWindow) return null;
  
  const options: OpenDialogOptions = {
    properties: ['openDirectory']
  };

  try {
    const result = (await dialog.showOpenDialog(mainWindow, options)) as unknown as OpenDialogReturnValue;
    return result.canceled ? null : result.filePaths[0];
  } catch (error) {
    console.error('Error selecting directory:', error);
    return null;
  }
});

ipcMain.handle('read-file', async (_: unknown, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const tags = await ExifReader.load(buffer);
    
    let latitude = null;
    let longitude = null;
    let error = null;
    
    if (tags.GPSLatitude?.description && tags.GPSLongitude?.description) {
      try {
        const latDesc = tags.GPSLatitude.description;
        const lonDesc = tags.GPSLongitude.description;
        const latRef = tags.GPSLatitudeRef?.value ? 
          (Array.isArray(tags.GPSLatitudeRef.value) ? tags.GPSLatitudeRef.value[0] : tags.GPSLatitudeRef.value) : 'N';
        const lonRef = tags.GPSLongitudeRef?.value ? 
          (Array.isArray(tags.GPSLongitudeRef.value) ? tags.GPSLongitudeRef.value[0] : tags.GPSLongitudeRef.value) : 'E';

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
    }

    return {
      exif: {
        latitude,
        longitude,
        error,
        dateTimeOriginal: tags.DateTimeOriginal?.description || null,
        make: tags.Make?.description || null,
        model: tags.Model?.description || null,
        exposureTime: tags.ExposureTime?.description || null,
        fNumber: tags.FNumber?.description ? parseFloat(tags.FNumber.description) : null,
        iso: tags.ISOSpeedRatings?.value ? 
          (Array.isArray(tags.ISOSpeedRatings.value) ? tags.ISOSpeedRatings.value[0] : tags.ISOSpeedRatings.value) : null,
        focalLength: tags.FocalLength?.description ? parseFloat(tags.FocalLength.description) : null
      },
      fileData: {
        base64: buffer.toString('base64'),
        mimeType: 'image/jpeg',
        fileName: path.basename(filePath)
      }
    };
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
});

// Store handlers
ipcMain.handle('get-store-value', (_: unknown, key: string) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (_: unknown, key: string, value: unknown) => {
  store.set(key, value);
});

ipcMain.handle('save-file', async (_: IpcMainInvokeEvent, options: { content: string; defaultFilename: string; filters: { name: string; extensions: string[] }[] }): Promise<boolean> => {
  try {
    const dialogOptions: SaveDialogOptions = {
      defaultPath: options.defaultFilename,
      filters: options.filters
    };

    const result = (await dialog.showSaveDialog(dialogOptions)) as unknown as SaveDialogReturnValue;
    if (result.canceled || !result.filePath) return false;

    await fs.promises.writeFile(result.filePath, options.content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving file:', error);
    return false;
  }
}); 