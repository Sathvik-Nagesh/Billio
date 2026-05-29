/**
 * Backup & Restore engine for Billio.
 *
 * Backup format: Billio_Backup_YYYY-MM-DD.zip
 * Contents:
 *   backup_manifest.json  — version, metadata, counts
 *   db.json               — full localStorage DB dump (billio_db)
 *   settings.json         — all persisted Zustand stores
 */

import JSZip from 'jszip';

const DB_KEY = 'billio_db';
const SETTINGS_KEYS = [
  'billio-theme',
  'billio-app-settings',
  'billio-app-state',
];

const BACKUP_VERSION = 1;
const APP_VERSION = '1.1.0';

export interface BackupManifest {
  version: number;
  appVersion: string;
  createdAt: string;
  businessCount: number;
  invoiceCount: number;
  customerCount: number;
  bookCount: number;
}

export interface RestorePreview {
  manifest: BackupManifest;
  businessCount: number;
  invoiceCount: number;
  customerCount: number;
  bookCount: number;
  createdAt: string;
}

// ─── Create Backup ────────────────────────────────────────────────────────────

export async function createBackup(): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    // Read the main database
    const rawDb = localStorage.getItem(DB_KEY);
    const dbData = rawDb ? JSON.parse(rawDb) : {};

    // Build manifest
    const manifest: BackupManifest = {
      version: BACKUP_VERSION,
      appVersion: APP_VERSION,
      createdAt: new Date().toISOString(),
      businessCount: (dbData.businesses ?? []).length,
      invoiceCount: (dbData.invoices ?? []).length,
      customerCount: (dbData.customers ?? []).length,
      bookCount: (dbData.books ?? []).length,
    };

    // Read all settings stores
    const settings: Record<string, string> = {};
    for (const key of SETTINGS_KEYS) {
      const val = localStorage.getItem(key);
      if (val) settings[key] = val;
    }

    // Build ZIP
    const zip = new JSZip();
    zip.file('backup_manifest.json', JSON.stringify(manifest, null, 2));
    zip.file('db.json', JSON.stringify(dbData, null, 2));
    zip.file('settings.json', JSON.stringify(settings, null, 2));

    // Generate and download
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const today = new Date().toISOString().split('T')[0];
    const filename = `Billio_Backup_${today}.zip`;

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error during backup.' };
  }
}

// ─── Parse & Validate Backup ──────────────────────────────────────────────────

export async function parseBackup(file: File): Promise<
  { success: true; preview: RestorePreview; dbData: any; settings: any } |
  { success: false; error: string }
> {
  try {
    const zip = await JSZip.loadAsync(file);

    // Validate manifest exists
    const manifestFile = zip.file('backup_manifest.json');
    if (!manifestFile) {
      return { success: false, error: 'Invalid backup file: missing manifest.' };
    }

    const manifest: BackupManifest = JSON.parse(await manifestFile.async('string'));

    // Version compatibility check
    if (manifest.version > BACKUP_VERSION) {
      return {
        success: false,
        error: `This backup was created with a newer version of Billio (v${manifest.appVersion}). Please update the app first.`,
      };
    }

    // Read DB and settings
    const dbFile = zip.file('db.json');
    const settingsFile = zip.file('settings.json');

    const dbData = dbFile ? JSON.parse(await dbFile.async('string')) : {};
    const settings = settingsFile ? JSON.parse(await settingsFile.async('string')) : {};

    const preview: RestorePreview = {
      manifest,
      businessCount: manifest.businessCount,
      invoiceCount: manifest.invoiceCount,
      customerCount: manifest.customerCount,
      bookCount: manifest.bookCount,
      createdAt: manifest.createdAt,
    };

    return { success: true, preview, dbData, settings };
  } catch (err: any) {
    return { success: false, error: `Failed to read backup file: ${err?.message ?? 'Unknown error'}` };
  }
}

// ─── Restore Backup ───────────────────────────────────────────────────────────

export async function restoreBackup(
  dbData: any,
  settings: any,
  autoBackupFirst = true
): Promise<{ success: boolean; error?: string }> {
  try {
    // Auto-backup current data first
    if (autoBackupFirst) {
      await createBackup();
    }

    // Restore main DB
    localStorage.setItem(DB_KEY, JSON.stringify(dbData));

    // Restore all settings stores
    for (const [key, value] of Object.entries(settings)) {
      localStorage.setItem(key, value as string);
    }

    // Reload app to pick up all restored state
    window.location.reload();

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error during restore.' };
  }
}
