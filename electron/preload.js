const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    queryDB: (sql, params) => ipcRenderer.invoke('query-db', sql, params),
    runDB: (sql, params) => ipcRenderer.invoke('run-db', sql, params),
    minimize: () => ipcRenderer.send("minimize-window"),
    openDevTools: () => ipcRenderer.send("open-devtools"),
    maximize: () => ipcRenderer.send("maximize-window"),
    close: () => ipcRenderer.send("close-window"),
});

contextBridge.exposeInMainWorld('auth', {
    pedirPass: () => ipcRenderer.invoke('pedir-pass')
})
console.log('Preload cargado!');