import { db, generateId } from '../index';
import {
  syncBooksToIndexedDB,
  deleteBookFromIndexedDB,
  clearIndexedDBBooks,
  getAllBooksFromIndexedDB,
  searchBooksIndexedDB
} from '../indexedDB';
import type { Book } from '../../../types';

const COLLECTION = 'books' as const;

export const bookRepository = {
  getAll(): Book[] {
    const books = db.getCollection<Book>(COLLECTION);
    return books.slice().sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
  },

  async getAllAsync(): Promise<Book[]> {
    const memBooks = this.getAll();
    if (memBooks.length > 0) return memBooks;
    const coldBooks = await getAllBooksFromIndexedDB();
    if (coldBooks.length > 0) {
      db.setCollection(COLLECTION, coldBooks);
    }
    return coldBooks;
  },

  search(query: string): Book[] {
    const books = db.getCollection<Book>(COLLECTION);
    const q = query.trim().toLowerCase();
    if (!q) {
      return books.slice().sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
    }
    const filtered = books.filter(b => b.name.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q)));
    return filtered.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
  },

  async searchAsync(query: string, limit = 50): Promise<Book[]> {
    const syncRes = this.search(query);
    if (syncRes.length > 0) return syncRes.slice(0, limit);
    return searchBooksIndexedDB(query, limit);
  },

  upsert(name: string, unitPrice: number, author?: string): Book {
    const books = db.getCollection<Book>(COLLECTION).slice();
    const cleanName = name.trim();
    const existingIndex = books.findIndex(b => b.name.toLowerCase() === cleanName.toLowerCase());
    
    if (existingIndex >= 0) {
      const existing = { ...books[existingIndex] };
      existing.usageCount += 1;
      if (author !== undefined) existing.author = author.trim() || undefined;
      existing.updatedAt = new Date().toISOString();
      books[existingIndex] = existing;
      db.setCollection(COLLECTION, books);
      syncBooksToIndexedDB([existing]).catch(() => {});
      return existing;
    }

    const now = new Date().toISOString();
    const newBook: Book = {
      id: generateId(),
      name: cleanName,
      author: author ? author.trim() : undefined,
      unitPrice,
      usageCount: 1,
      createdAt: now,
      updatedAt: now,
    };
    books.push(newBook);
    db.setCollection(COLLECTION, books);
    syncBooksToIndexedDB([newBook]).catch(() => {});
    return newBook;
  },

  /**
   * Batch upsert for blazing-fast CSV imports in O(N) single disk sync
   */
  upsertMany(items: Array<{ name: string; unitPrice: number; author?: string }>): number {
    if (items.length === 0) return 0;
    const books = db.getCollection<Book>(COLLECTION).slice();
    const mapByName = new Map<string, number>();

    books.forEach((b, idx) => {
      mapByName.set(b.name.toLowerCase(), idx);
    });

    const now = new Date().toISOString();
    let count = 0;
    const modifiedBooks: Book[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const cleanName = item.name.trim();
      if (!cleanName) continue;

      const lower = cleanName.toLowerCase();
      if (mapByName.has(lower)) {
        const idx = mapByName.get(lower)!;
        const updated = {
          ...books[idx],
          usageCount: books[idx].usageCount + 1,
          author: item.author ? item.author.trim() : books[idx].author,
          updatedAt: now,
        };
        books[idx] = updated;
        modifiedBooks.push(updated);
      } else {
        const newBook: Book = {
          id: generateId(),
          name: cleanName,
          author: item.author ? item.author.trim() : undefined,
          unitPrice: item.unitPrice,
          usageCount: 1,
          createdAt: now,
          updatedAt: now,
        };
        const newIdx = books.push(newBook) - 1;
        mapByName.set(lower, newIdx);
        modifiedBooks.push(newBook);
      }
      count++;
    }

    db.setCollection(COLLECTION, books);
    syncBooksToIndexedDB(modifiedBooks).catch(() => {});
    return count;
  },

  update(id: string, data: Partial<Omit<Book, 'id' | 'createdAt' | 'usageCount'>>): Book | null {
    const books = db.getCollection<Book>(COLLECTION).slice();
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return null;
    
    books[index] = { ...books[index], ...data, updatedAt: new Date().toISOString() };
    db.setCollection(COLLECTION, books);
    syncBooksToIndexedDB([books[index]]).catch(() => {});
    return books[index];
  },

  delete(id: string): void {
    const books = db.getCollection<Book>(COLLECTION);
    db.setCollection(COLLECTION, books.filter(b => b.id !== id));
    deleteBookFromIndexedDB(id).catch(() => {});
  },

  clearAll(): void {
    db.setCollection(COLLECTION, []);
    clearIndexedDBBooks().catch(() => {});
  },

  incrementUsage(id: string): void {
    const books = db.getCollection<Book>(COLLECTION).slice();
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
      books[index] = { ...books[index], usageCount: books[index].usageCount + 1 };
      db.setCollection(COLLECTION, books);
      syncBooksToIndexedDB([books[index]]).catch(() => {});
    }
  }
};
