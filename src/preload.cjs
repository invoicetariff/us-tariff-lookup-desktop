const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tariff', {
  search: (q, limit) => ipcRenderer.invoke('engine:search', q, limit),
  calc: (input) => ipcRenderer.invoke('engine:calc', input),
  meta: () => ipcRenderer.invoke('engine:meta'),
});
