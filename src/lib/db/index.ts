// High-performance Multi-tenant database module
// Features: Instant in-memory cache, batched disk sync, zero-latency reads/writes

import { toast } from 'sonner';

const BASE_DB_KEY = 'billio_db';
const ACTIVE_TENANT_KEY = 'billio_active_tenant_id';

let currentTenantId: string = (() => {
  try {
    // Purge legacy bloated Zustand key if present
    localStorage.removeItem('billio-active-business');
    return localStorage.getItem(ACTIVE_TENANT_KEY) || 'default';
  } catch {
    return 'default';
  }
})();

function getDbKey(tenantId: string = currentTenantId): string {
  if (!tenantId || tenantId === 'default' || tenantId === 'tenant_default') {
    return BASE_DB_KEY;
  }
  return `${BASE_DB_KEY}_${tenantId}`;
}

export interface DBStore {
  businesses: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
  invoice_items: Record<string, unknown>[];
  settings: Record<string, string>;
  invoice_sequences: Record<string, unknown>[];
  books: Record<string, unknown>[];
}

const defaultStore: DBStore = {
  businesses: [],
  customers: [],
  invoices: [],
  invoice_items: [],
  settings: {},
  invoice_sequences: [],
  books: [],
};

const memoryCaches: Record<string, DBStore> = {};
const pendingWrites: Set<string> = new Set();
let flushTimer: any = null;

function getStore(tenantId: string = currentTenantId): DBStore {
  const key = getDbKey(tenantId);
  if (memoryCaches[key]) return memoryCaches[key];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return (memoryCaches[key] = { ...defaultStore });
    return (memoryCaches[key] = { ...defaultStore, ...JSON.parse(raw) });
  } catch {
    return (memoryCaches[key] = { ...defaultStore });
  }
}

function flushKeyToDisk(key: string): void {
  const store = memoryCaches[key];
  if (!store) return;
  try {
    localStorage.setItem(key, JSON.stringify(store));
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.error('Storage full! Data could not be saved to disk.');
      toast.error('Storage Full! Please delete old invoices or businesses to save new data.');
    } else {
      console.error('Failed to save to localStorage:', err);
    }
  }
}

function scheduleSaveStore(tenantId: string = currentTenantId): void {
  const key = getDbKey(tenantId);
  pendingWrites.add(key);

  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    pendingWrites.forEach((k) => {
      flushKeyToDisk(k);
    });
    pendingWrites.clear();
  }, 50);
}

function saveStore(store: DBStore, tenantId: string = currentTenantId): void {
  const key = getDbKey(tenantId);
  memoryCaches[key] = store;
  scheduleSaveStore(tenantId);
}

// Ensure all pending writes are flushed immediately before page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pendingWrites.size > 0) {
      pendingWrites.forEach((k) => flushKeyToDisk(k));
      pendingWrites.clear();
    }
  });

  // Keep memory cache synced if local storage changes across tabs
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(BASE_DB_KEY) && e.newValue) {
      try {
        memoryCaches[e.key] = { ...defaultStore, ...JSON.parse(e.newValue) };
      } catch {
        // ignore
      }
    }
  });
}

export const db = {
  getTenantId: (): string => currentTenantId,
  setTenantId: (tenantId: string): void => {
    currentTenantId = tenantId || 'default';
  },
  getStore: (tenantId?: string): DBStore => getStore(tenantId),
  saveStore: (store: DBStore, tenantId?: string): void => saveStore(store, tenantId),
  flush: (): void => {
    pendingWrites.forEach((k) => flushKeyToDisk(k));
    pendingWrites.clear();
  },
  getCollection: <T>(name: keyof DBStore, tenantId?: string): T[] => {
    const store = getStore(tenantId);
    return (store[name] as T[]) || [];
  },
  setCollection: <T>(name: keyof DBStore, items: T[], tenantId?: string): void => {
    const store = getStore(tenantId);
    (store as unknown as Record<string, unknown>)[name] = items;
    saveStore(store, tenantId);
  },
  getSetting: (key: string, tenantId?: string): string | null => {
    const store = getStore(tenantId);
    return store.settings[key] ?? null;
  },
  setSetting: (key: string, value: string, tenantId?: string): void => {
    const store = getStore(tenantId);
    store.settings[key] = value;
    saveStore(store, tenantId);
  },
};

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
