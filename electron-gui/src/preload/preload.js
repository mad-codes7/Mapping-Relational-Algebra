const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  translate: (raExpression) => ipcRenderer.invoke('translate', raExpression),
  getSchema: ()             => ipcRenderer.invoke('get-schema'),
});
