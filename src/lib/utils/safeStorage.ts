import type { StateStorage } from 'zustand/middleware';

/**
 * Safe local storage wrapper for Zustand persistence.
 * Prevents Uncaught QuotaExceededError from crashing the React application tree
 * when large catalogs, logos, or base64 images are restored.
 */
export const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(name, value);
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || err?.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn(`[safeLocalStorage] Quota exceeded while saving '${name}'. Safely ignored to prevent application crash.`);
      } else {
        console.warn(`[safeLocalStorage] Failed to save '${name}':`, err);
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};
