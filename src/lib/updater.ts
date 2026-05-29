/**
 * Renderer-side updater API.
 * Wraps ipcRenderer calls and falls back gracefully in browser-only mode.
 */

const isElectron = (): boolean => {
  return typeof window !== 'undefined' &&
    typeof (window as any).require === 'function';
};

function getIpc() {
  if (!isElectron()) return null;
  try {
    const { ipcRenderer } = (window as any).require('electron');
    return ipcRenderer;
  } catch {
    return null;
  }
}

export interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseName?: string;
  releaseDate?: string;
}

export interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export type UpdaterEventType =
  | 'updater:checking'
  | 'updater:available'
  | 'updater:not-available'
  | 'updater:progress'
  | 'updater:downloaded'
  | 'updater:error';

export const updater = {
  /** Get current app version */
  async getVersion(): Promise<string> {
    const ipc = getIpc();
    if (!ipc) return '1.1.0'; // fallback for browser
    return ipc.invoke('get-app-version');
  },

  /** Trigger check for updates */
  async checkForUpdates(): Promise<{ status: string; message?: string }> {
    const ipc = getIpc();
    if (!ipc) return { status: 'dev-mode', message: 'Running in browser (not Electron).' };
    return ipc.invoke('check-for-updates');
  },

  /** Start downloading the available update */
  async downloadUpdate(): Promise<{ status: string; message?: string }> {
    const ipc = getIpc();
    if (!ipc) return { status: 'error', message: 'Not running in Electron.' };
    return ipc.invoke('download-update');
  },

  /** Quit and install the downloaded update */
  installUpdate(): void {
    const ipc = getIpc();
    if (ipc) ipc.invoke('install-update');
  },

  /** Listen to updater events from main process */
  on(event: UpdaterEventType, callback: (data?: any) => void): () => void {
    const ipc = getIpc();
    if (!ipc) return () => {};
    ipc.on(event, (_: any, data: any) => callback(data));
    return () => ipc.removeListener(event, callback);
  },
};
