const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const prompt = require('electron-prompt');
const { autoUpdater } = require('electron-updater');


const isDev = !app.isPackaged;
let win;
let db;

// ---------------- LOG ----------------
const logPath = path.join(app.getPath('userData'), 'main.log');
function log(msg) {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
}

// ---------------- ERROR HANDLERS ----------------
process.on('uncaughtException', (err) => {
    log('UNCAUGHT: ' + err.stack);
    dialog.showErrorBox('Error crítico', err.stack);
});

process.on('unhandledRejection', (err) => {
    log('UNHANDLED: ' + err);
});

// ---------------- CREAR VENTANA ----------------
function createWindow() {
    win = new BrowserWindow({
        show: false,
        width: 1366,
        height: 768,
        frame: false,
        icon: path.join(__dirname, 'k12logo.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    // Atajo para abrir DevTools
    globalShortcut.register('Control+Shift+D', () => {
        win.webContents.openDevTools({ mode: 'detach' });
    });

    // Mostrar ventana cuando esté lista
    win.once('ready-to-show', () => {
        log('READY TO SHOW');
        win.show();
    });

    // Cargar Angular
    if (isDev) {
        win.loadURL('http://localhost:4200');
        log('Loading URL: http://localhost:4200');
    } else {
        autoUpdater.checkForUpdatesAndNotify();
        const indexPath = path.join(process.resourcesPath, 'app', 'angular', 'dist', 'angular', 'browser', 'index.html'); log('Loading file: ' + indexPath);
        win.loadFile(indexPath);
    }
}
//-----------------Updater--------------
if (!isDev) {
    autoUpdater.on('checking-for-update', () => {
        log('Buscando actualizaciones...');
    });

    autoUpdater.on('update-available', (info) => {
        log('Actualización disponible: ' + info.version);
        // Aquí podrías notificar al usuario con un dialog
    });

    autoUpdater.on('update-not-available', () => {
        log('No hay actualizaciones');
    });

    autoUpdater.on('error', (err) => {
        log('Error actualizando: ' + err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        log(`Descargando: ${Math.round(progressObj.percent)}%`);
    });

    autoUpdater.on('update-downloaded', (info) => {
        log('Actualización descargada');
        autoUpdater.quitAndInstall();
    });
}
// ---------------- IPC ----------------
ipcMain.on('minimize-window', () => win?.minimize());
ipcMain.on('maximize-window', () => win?.isMaximized() ? win.unmaximize() : win.maximize());
ipcMain.on('close-window', () => win?.close());

ipcMain.handle('pedir-pass', async () => {
    return prompt({
        title: 'Autorización requerida',
        label: 'Ingrese la credencial',
        inputAttrs: { type: 'password' },
        type: 'input',
        alwaysOnTop: true,
        height: 160
    });
});

ipcMain.handle('query-db', (_, query, params = []) => {
    return db.prepare(query).all(params);
});

ipcMain.handle('run-db', (_, query, params = []) => {
    const result = db.prepare(query).run(params);
    return { lastID: result.lastInsertRowid, changes: result.changes };
});

// ---------------- APP READY ----------------
app.whenReady().then(() => {
    try {
        log('APP READY');

        // Base de datos
        const userDbPath = path.join(app.getPath('userData'), 'bazar.db');
        const bundledDbPath = path.join(process.resourcesPath, 'app', 'bazar.db');

        if (!fs.existsSync(userDbPath) && fs.existsSync(bundledDbPath)) {
            fs.copyFileSync(bundledDbPath, userDbPath);
            log('DB copied to userData');
        }
        db = new Database(userDbPath);
        log('DB opened');

        createWindow();
        log('Window created');
        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }



    } catch (e) {
        log('CRASH: ' + e.stack);
        throw e;
    }
});

// ---------------- QUIT ----------------
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
