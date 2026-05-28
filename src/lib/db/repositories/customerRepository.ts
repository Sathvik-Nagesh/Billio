import { db, generateId } from '../index';
import type { Customer } from '../../../types';

const COLLECTION = 'customers' as const;

export const customerRepository = {
  getAll(): Customer[] {
    return db.getCollection<Customer>(COLLECTION);
  },

  getById(id: string): Customer | null {
    return this.getAll().find(c => c.id === id) ?? null;
  },

  search(query: string): Customer[] {
    const q = query.toLowerCase();
    return this.getAll().filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q)
    ).slice(0, 10);
  },

  upsertByName(data: { name: string; phone?: string; email?: string; address?: string; gstin?: string; notes?: string }): Customer {
    const existing = this.getAll().find(c => c.name.toLowerCase() === data.name.toLowerCase());
    if (existing) {
      return this.update(existing.id, data) ?? existing;
    }
    return this.create(data);
  },

  create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    const customers = this.getAll();
    const now = new Date().toISOString();
    const customer: Customer = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    customers.push(customer);
    db.setCollection(COLLECTION, customers);
    return customer;
  },

  update(id: string, data: Partial<Customer>): Customer | null {
    const customers = this.getAll();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    customers[idx] = { ...customers[idx], ...data, id, updatedAt: new Date().toISOString() };
    db.setCollection(COLLECTION, customers);
    return customers[idx];
  },

  delete(id: string): void {
    db.setCollection(COLLECTION, this.getAll().filter(c => c.id !== id));
  },
};
