const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Expose a function to the renderer
  translate: (raExpression) => ipcRenderer.invoke('translate', raExpression)
});