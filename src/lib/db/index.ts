// Database module - uses localStorage as mock for browser-only mode
// In Tauri, this will use tauri-plugin-sql

const DB_KEY = 'billio_db';

interface DBStore {
  businesses: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
  invoice_items: Record<string, unknown>[];
  settings: Record<string, string>;
  invoice_sequences: Record<string, unknown>[];
}

const defaultStore: DBStore = {
  businesses: [],
  customers: [],
  invoices: [],
  invoice_items: [],
  settings: {},
  invoice_sequences: [],
};

function getStore(): DBStore {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return { ...defaultStore };
    return { ...defaultStore, ...JSON.parse(raw) };
  } catch {
    return { ...defaultStore };
  }
}

function saveStore(store: DBStore): void {
  localStorage.setItem(DB_KEY, JSON.stringify(store));
}

export const db = {
  getStore,
  saveStore,
  getCollection: <T>(name: keyof DBStore): T[] => {
    const store = getStore();
    return (store[name] as T[]) || [];
  },
  setCollection: <T>(name: keyof DBStore, items: T[]): void => {
    const store = getStore();
    (store as unknown as Record<string, unknown>)[name] = items;
    saveStore(store);
  },
  getSetting: (key: string): string | null => {
    const store = getStore();
    return store.settings[key] ?? null;
  },
  setSetting: (key: string, value: string): void => {
    const store = getStore();
    store.settings[key] = value;
    saveStore(store);
  },
};

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
