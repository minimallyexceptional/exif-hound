"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowManager = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
class WindowManager {
    constructor() {
        this.mainWindow = null;
        // Session setup moved to setupSession method
    }
    setupSession() {
        this.customSession = electron_1.session.fromPartition('persist:exifhound');
        this.customSession.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': config_1.config.security.csp
                }
            });
        });
    }
    createWindow() {
        if (this.mainWindow) {
            return this.mainWindow;
        }
        this.mainWindow = new electron_1.BrowserWindow({
            width: config_1.config.window.width,
            height: config_1.config.window.height,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                preload: path_1.default.join(__dirname, 'preload.js'),
                session: this.customSession,
                devTools: process.env.NODE_ENV === 'development'
            },
            titleBarStyle: config_1.config.window.titleBarStyle,
            backgroundColor: config_1.config.window.backgroundColor
        });
        // Set app user model id for Windows
        if (process.platform === 'win32') {
            require('electron').app.setAppUserModelId('com.exifhound.app');
        }
        this.loadContent();
        this.setupEventListeners();
        return this.mainWindow;
    }
    loadContent() {
        if (!this.mainWindow)
            return;
        if (process.env.VITE_DEV_SERVER_URL) {
            this.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).catch(console.error);
            if (process.env.OPEN_DEVTOOLS === 'true') {
                this.mainWindow.webContents.openDevTools();
            }
        }
        else {
            this.mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html')).catch(console.error);
        }
    }
    setupEventListeners() {
        if (!this.mainWindow)
            return;
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }
    getMainWindow() {
        return this.mainWindow;
    }
    getSession() {
        return this.customSession;
    }
}
exports.WindowManager = WindowManager;
