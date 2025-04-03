const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    selectFiles: () => ipcRenderer.invoke('select-files'),
    selectExportDirectory: () => ipcRenderer.invoke('select-export-directory'),
    getStoreValue: (key: string) => ipcRenderer.invoke('get-store-value', key),
    setStoreValue: (key: string, value: unknown) => ipcRenderer.invoke('set-store-value', key, value),
    readFile: (filePath: string) => {
      return ipcRenderer.invoke('read-file', filePath);
    },
    getFileUrl: (filePath: string) => {
      return `file://${filePath}`;
    },
    saveFile: (options: { content: string; defaultFilename: string; filters: { name: string; extensions: string[] }[] }) => {
      return ipcRenderer.invoke('save-file', options);
    }
  }
); 