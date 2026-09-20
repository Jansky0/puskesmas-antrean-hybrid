const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openTvWindow: () => ipcRenderer.send('open-tv-window'),
  printSilent: (ticketNumber, roomName) => ipcRenderer.send('print-silent', { ticketNumber, roomName }),
});
