"use strict";
const { contextBridge, ipcRenderer } = require("electron");
require("fs");
contextBridge.exposeInMainWorld(
  "api",
  {
    selectFiles: () => ipcRenderer.invoke("select-files"),
    selectExportDirectory: () => ipcRenderer.invoke("select-export-directory"),
    getStoreValue: (key) => ipcRenderer.invoke("get-store-value", key),
    setStoreValue: (key, value) => ipcRenderer.invoke("set-store-value", key, value),
    readFile: (filePath) => {
      return ipcRenderer.invoke("read-file", filePath);
    },
    getFileUrl: (filePath) => {
      return `file://${filePath}`;
    },
    saveFile: (options) => {
      return ipcRenderer.invoke("save-file", options);
    }
  }
);
