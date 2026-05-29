import { db, generateId } from '../index';
import type { Book } from '../../../types';

const COLLECTION = 'books' as const;

export const bookRepository = {
  getAll(): Book[] {
    const books = db.getCollection<Book>(COLLECTION);
    return books.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
  },

  search(query: string): Book[] {
    const books = this.getAll();
    if (!query.trim()) return books;
    const lowerQuery = query.toLowerCase();
    return books.filter(b => b.name.toLowerCase().includes(lowerQuery));
  },

  upsert(name: string, unitPrice: number): Book {
    const books = db.getCollection<Book>(COLLECTION);
    const existingIndex = books.findIndex(b => b.name.toLowerCase() === name.toLowerCase());
    
    if (existingIndex >= 0) {
      // Exist: we keep the existing price (as per design choice), just increment usage
      const existing = books[existingIndex];
      existing.usageCount += 1;
      // We don't update unitPrice silently to avoid surprising the user
      existing.updatedAt = new Date().toISOString();
      books[existingIndex] = existing;
      db.setCollection(COLLECTION, books);
      return existing;
    }

    // Create new
    const now = new Date().toISOString();
    const newBook: Book = {
      id: generateId(),
      name,
      unitPrice,
      usageCount: 1,
      createdAt: now,
      updatedAt: now,
    };
    books.push(newBook);
    db.setCollection(COLLECTION, books);
    return newBook;
  },

  update(id: string, data: Partial<Omit<Book, 'id' | 'createdAt' | 'usageCount'>>): Book | null {
    const books = db.getCollection<Book>(COLLECTION);
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return null;
    
    books[index] = { ...books[index], ...data, updatedAt: new Date().toISOString() };
    db.setCollection(COLLECTION, books);
    return books[index];
  },

  delete(id: string): void {
    const books = db.getCollection<Book>(COLLECTION);
    db.setCollection(COLLECTION, books.filter(b => b.id !== id));
  },

  incrementUsage(id: string): void {
    const books = db.getCollection<Book>(COLLECTION);
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
      books[index].usageCount += 1;
      db.setCollection(COLLECTION, books);
    }
  }
};
