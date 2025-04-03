import { BrowserWindow, session } from 'electron';
import path from 'path';
import { config } from './config';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private customSession: Electron.Session | undefined;

  constructor() {
    // Session setup moved to setupSession method
  }

  public setupSession() {
    this.customSession = session.fromPartition('persist:exifhound');
    this.customSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': config.security.csp
        }
      });
    });
  }

  public createWindow() {
    if (this.mainWindow) {
      return this.mainWindow;
    }

    this.mainWindow = new BrowserWindow({
      width: config.window.width,
      height: config.window.height,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        session: this.customSession,
        devTools: process.env.NODE_ENV === 'development'
      },
      titleBarStyle: config.window.titleBarStyle,
      backgroundColor: config.window.backgroundColor
    });

    // Set app user model id for Windows
    if (process.platform === 'win32') {
      require('electron').app.setAppUserModelId('com.exifhound.app');
    }

    this.loadContent();
    this.setupEventListeners();

    return this.mainWindow;
  }

  private loadContent() {
    if (!this.mainWindow) return;

    if (process.env.VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).catch(console.error);
      if (process.env.OPEN_DEVTOOLS === 'true') {
        this.mainWindow.webContents.openDevTools();
      }
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(console.error);
    }
  }

  private setupEventListeners() {
    if (!this.mainWindow) return;

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public getSession(): Electron.Session | undefined {
    return this.customSession;
  }
} 