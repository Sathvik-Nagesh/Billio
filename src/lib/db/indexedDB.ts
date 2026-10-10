/**
 * Billio IndexedDB Cold Storage Layer
 * Supports high-scale offline storage for 10,000+ to 100,000+ book SKUs and catalog backups
 * without exhausting localStorage quota.
 */

import type { Book } from '@/types';

const DB_NAME = 'billio_cold_storage';
const DB_VERSION = 1;
const STORE_NAME = 'books_cold';

let dbInstance: IDBDatabase | null = null;

export function openIndexedDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('author', 'author', { unique: false });
        store.createIndex('usageCount', 'usageCount', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Bulk persist books into IndexedDB asynchronously
 */
export async function syncBooksToIndexedDB(books: Book[]): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Put items in transaction
    for (const book of books) {
      store.put(book);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] syncBooksToIndexedDB warning:', err);
  }
}

/**
 * Retrieve all books from IndexedDB cold storage
 */
export async function getAllBooksFromIndexedDB(): Promise<Book[]> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve((request.result as Book[]) || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] getAllBooksFromIndexedDB warning:', err);
    return [];
  }
}

/**
 * Async query books in IndexedDB with match limit
 */
export async function searchBooksIndexedDB(query: string, limit = 50): Promise<Book[]> {
  const books = await getAllBooksFromIndexedDB();
  const q = query.trim().toLowerCase();
  if (!q) {
    return books
      .sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name))
      .slice(0, limit);
  }

  const results: Book[] = [];
  for (const b of books) {
    if (
      b.name.toLowerCase().includes(q) ||
      (b.author && b.author.toLowerCase().includes(q))
    ) {
      results.push(b);
      if (results.length >= limit) break;
    }
  }

  return results.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
}

/**
 * Delete a book from IndexedDB
 */
export async function deleteBookFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {
    console.warn('[IndexedDB] deleteBookFromIndexedDB warning:', err);
  }
}

/**
 * Clear all books from IndexedDB
 */
export async function clearIndexedDBBooks(): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (err) {
    console.warn('[IndexedDB] clearIndexedDBBooks warning:', err);
  }
}
