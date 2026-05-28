import { db, generateId } from '../index';
import type { Business } from '../../../types';

const COLLECTION = 'businesses' as const;

export const businessRepository = {
  getAll(): Business[] {
    return db.getCollection<Business>(COLLECTION);
  },

  getById(id: string): Business | null {
    return this.getAll().find(b => b.id === id) ?? null;
  },

  getDefault(): Business | null {
    const all = this.getAll();
    return all.find(b => b.isDefault) ?? all[0] ?? null;
  },

  create(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Business {
    const businesses = this.getAll();
    const now = new Date().toISOString();
    const business: Business = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    if (business.isDefault) {
      businesses.forEach(b => { b.isDefault = false; });
    }
    if (businesses.length === 0) business.isDefault = true;
    businesses.push(business);
    db.setCollection(COLLECTION, businesses);
    return business;
  },

  update(id: string, data: Partial<Business>): Business | null {
    const businesses = this.getAll();
    const idx = businesses.findIndex(b => b.id === id);
    if (idx === -1) return null;
    if (data.isDefault) {
      businesses.forEach(b => { b.isDefault = false; });
    }
    businesses[idx] = {
      ...businesses[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    db.setCollection(COLLECTION, businesses);
    return businesses[idx];
  },

  delete(id: string): void {
    const businesses = this.getAll().filter(b => b.id !== id);
    if (businesses.length > 0 && !businesses.some(b => b.isDefault)) {
      businesses[0].isDefault = true;
    }
    db.setCollection(COLLECTION, businesses);
  },
};
