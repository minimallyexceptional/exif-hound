import { app, ipcMain, dialog } from 'electron';
import type { IpcMainInvokeEvent, OpenDialogOptions, SaveDialogOptions, OpenDialogReturnValue, SaveDialogReturnValue } from 'electron';
import fs from 'fs';
import { config } from './config';
import { WindowManager } from './window';
import { ProtocolManager } from './protocol';
import { ExifProcessor } from './exif';

// Register schemes before app is ready
ProtocolManager.registerSchemes();

// Disable GPU acceleration and cache
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-features', 'NetworkService,OutOfBlinkCors');
app.commandLine.appendSwitch('disable-http-cache');

// Ensure directories exist with error handling
try {
  if (fs.existsSync(config.paths.userData)) {
    fs.rmSync(config.paths.userData, { recursive: true, force: true });
  }
  fs.mkdirSync(config.paths.userData, { recursive: true });
  fs.mkdirSync(config.paths.cache, { recursive: true });
} catch (error) {
  console.error('Error managing directories:', error);
}

// Set paths
app.setPath('userData', config.paths.userData);
app.setPath('sessionData', config.paths.userData);
app.setPath('cache', config.paths.cache);

const windowManager = new WindowManager();

// Initialize the app
app.whenReady().then(() => {
  windowManager.setupSession();
  ProtocolManager.setupProtocols();
  windowManager.createWindow();

  app.on('activate', () => {
    if (windowManager.getMainWindow() === null) {
      windowManager.createWindow();
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
    fs.rmSync(config.paths.userData, { recursive: true, force: true });
  } catch (error) {
    console.error('Error cleaning up temp directory:', error);
  }
});

// IPC Handlers
ipcMain.handle('select-files', async (): Promise<string[]> => {
  const mainWindow = windowManager.getMainWindow();
  if (!mainWindow) return [];
  
  const options: OpenDialogOptions = {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: config.fileTypes.images }
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
  const mainWindow = windowManager.getMainWindow();
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
  return ExifProcessor.processImage(filePath);
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