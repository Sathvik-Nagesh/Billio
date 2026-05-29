import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Updater Configuration ────────────────────────────────────────────────────
autoUpdater.autoDownload = false; // Manual download trigger
autoUpdater.autoInstallOnAppQuit = false;

let mainWindow = null;

function sendToRenderer(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

// ─── Auto Updater Events ──────────────────────────────────────────────────────
autoUpdater.on('checking-for-update', () => {
  sendToRenderer('updater:checking');
});

autoUpdater.on('update-available', (info) => {
  sendToRenderer('updater:available', info);
});

autoUpdater.on('update-not-available', (info) => {
  sendToRenderer('updater:not-available', info);
});

autoUpdater.on('download-progress', (progress) => {
  sendToRenderer('updater:progress', progress);
});

autoUpdater.on('update-downloaded', (info) => {
  sendToRenderer('updater:downloaded', info);
});

autoUpdater.on('error', (err) => {
  sendToRenderer('updater:error', err?.message ?? 'Unknown error');
});

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { status: 'dev-mode', message: 'Update check is disabled in development mode.' };
  }
  try {
    await autoUpdater.checkForUpdates();
    return { status: 'checking' };
  } catch (err) {
    return { status: 'error', message: err?.message ?? 'Failed to check for updates.' };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { status: 'downloading' };
  } catch (err) {
    return { status: 'error', message: err?.message ?? 'Failed to download update.' };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true); // silent=false, forceRunAfter=true
});

// ─── Window Creation ──────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: 'Billio',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      contextIsolation: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();

  // Silently check for updates 5 seconds after launch (not in dev)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 5000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
