/**
 * Universal updater API for Electron, Mobile APK (Capacitor), and PWA.
 */

const isElectron = (): boolean => {
  return typeof window !== 'undefined' &&
    typeof (window as any).require === 'function';
};

const isCapacitor = (): boolean => {
  return typeof window !== 'undefined' &&
    typeof (window as any).Capacitor !== 'undefined';
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
  downloadUrl?: string;
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

type EventListener = (data?: any) => void;
const listeners: Map<UpdaterEventType, Set<EventListener>> = new Map();

function emit(event: UpdaterEventType, data?: any) {
  listeners.get(event)?.forEach(cb => cb(data));
}

export const updater = {
  /** Get current app version */
  async getVersion(): Promise<string> {
    const ipc = getIpc();
    if (ipc) return ipc.invoke('get-app-version');
    return '1.1.24'; // current Billio release version
  },

  /** Trigger check for updates (Electron, APK, or PWA) */
  async checkForUpdates(): Promise<{ status: string; message?: string; info?: UpdateInfo }> {
    const ipc = getIpc();
    if (ipc) {
      return ipc.invoke('check-for-updates');
    }

    emit('updater:checking');

    try {
      const token = (import.meta as any).env?.VITE_GITHUB_TOKEN || '';
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        ...(token ? { 'Authorization': `token ${token}` } : {})
      };

      // Check GitHub releases API for latest web/APK release
      const res = await fetch('https://api.github.com/repos/Sathvik-Nagesh/Billio/releases/latest', {
        headers,
      });

      if (!res.ok) {
        emit('updater:not-available');
        return { status: 'up-to-date', message: 'You are on the latest version.' };
      }

      const release = await res.json();
      const latestTag = release.tag_name ? release.tag_name.replace(/^v/, '') : '';
      const currentVersion = await updater.getVersion();

      if (latestTag && latestTag !== currentVersion) {
        const apkAsset = release.assets?.find((a: any) => a.name.endsWith('.apk'));
        const updateInfo: UpdateInfo = {
          version: latestTag,
          releaseName: release.name || `Version ${latestTag}`,
          releaseNotes: release.body || '',
          releaseDate: release.published_at,
          downloadUrl: apkAsset ? apkAsset.browser_download_url : release.html_url,
        };
        emit('updater:available', updateInfo);
        return { status: 'available', info: updateInfo };
      }

      // Check Service Worker for PWA update if present
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          reg.update();
        }
      }

      emit('updater:not-available');
      return { status: 'up-to-date', message: 'You are on the latest version.' };
    } catch (e: any) {
      emit('updater:not-available');
      return { status: 'up-to-date', message: 'App is running latest build.' };
    }
  },

  /** Start downloading or redirecting to the latest release / APK */
  async downloadUpdate(downloadUrl?: string): Promise<{ status: string; message?: string }> {
    const ipc = getIpc();
    if (ipc) {
      return ipc.invoke('download-update');
    }

    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      return { status: 'downloading', message: 'Downloading latest release...' };
    }

    return { status: 'error', message: 'No download URL specified.' };
  },

  /** Quit and install the downloaded update */
  installUpdate(): void {
    const ipc = getIpc();
    if (ipc) {
      ipc.invoke('install-update');
      return;
    }
    // Web / PWA reload
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  },

  /** Listen to updater events */
  on(event: UpdaterEventType, callback: EventListener): () => void {
    const ipc = getIpc();
    if (ipc) {
      ipc.on(event, (_: any, data: any) => callback(data));
      return () => ipc.removeListener(event, callback);
    }

    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(callback);

    return () => {
      listeners.get(event)?.delete(callback);
    };
  },
};
