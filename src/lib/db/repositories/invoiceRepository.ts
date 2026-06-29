import { db, generateId } from '../index';
import type { Invoice, InvoiceItem } from '../../../types';
import { businessRepository } from './businessRepository';

const INV_COLLECTION = 'invoices' as const;
const ITEM_COLLECTION = 'invoice_items' as const;
const SEQ_COLLECTION = 'invoice_sequences' as const;

interface Sequence { businessId: string; yearKey: string; lastNumber: number; }

export const invoiceRepository = {
  getAll(): Invoice[] {
    const invoices = db.getCollection<Invoice>(INV_COLLECTION);
    return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getById(id: string): Invoice | null {
    const inv = this.getAll().find(i => i.id === id) ?? null;
    if (!inv) return null;
    inv.items = this.getItems(id);
    return inv;
  },

  getItems(invoiceId: string): InvoiceItem[] {
    return db.getCollection<InvoiceItem>(ITEM_COLLECTION)
      .filter(i => i.invoiceId === invoiceId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  search(query: string, businessId?: string, startDate?: string, endDate?: string): Invoice[] {
    let results = this.getAll();
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(i =>
        i.invoiceNumber?.toLowerCase().includes(q) ||
        i.customerName?.toLowerCase().includes(q) ||
        (i.customerAddress && i.customerAddress.toLowerCase().includes(q))
      );
    }
    if (businessId) results = results.filter(i => i.businessId === businessId);
    if (startDate) results = results.filter(i => i.invoiceDate >= startDate);
    if (endDate) results = results.filter(i => i.invoiceDate <= endDate);
    return results;
  },

  create(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>, items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]): Invoice {
    const now = new Date().toISOString();
    const id = generateId();
    const invoice: Invoice = { ...data, id, createdAt: now, updatedAt: now };
    const invoices = db.getCollection<Invoice>(INV_COLLECTION);
    invoices.push(invoice);
    db.setCollection(INV_COLLECTION, invoices);

    const allItems = db.getCollection<InvoiceItem>(ITEM_COLLECTION);
    items.forEach((item, idx) => {
      allItems.push({ ...item, id: generateId(), invoiceId: id, sortOrder: idx });
    });
    db.setCollection(ITEM_COLLECTION, allItems);

    this.incrementSequence(data.businessId);
    return invoice;
  },

  update(id: string, data: Partial<Invoice>, items?: Omit<InvoiceItem, 'id' | 'invoiceId'>[]): Invoice | null {
    const invoices = db.getCollection<Invoice>(INV_COLLECTION);
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) return null;
    invoices[idx] = { ...invoices[idx], ...data, id, updatedAt: new Date().toISOString() };
    db.setCollection(INV_COLLECTION, invoices);

    if (items !== undefined) {
      const allItems = db.getCollection<InvoiceItem>(ITEM_COLLECTION).filter(i => i.invoiceId !== id);
      items.forEach((item, sortIdx) => {
        allItems.push({ ...item, id: generateId(), invoiceId: id, sortOrder: sortIdx });
      });
      db.setCollection(ITEM_COLLECTION, allItems);
    }
    return invoices[idx];
  },

  delete(id: string): void {
    db.setCollection(INV_COLLECTION, db.getCollection<Invoice>(INV_COLLECTION).filter(i => i.id !== id));
    db.setCollection(ITEM_COLLECTION, db.getCollection<InvoiceItem>(ITEM_COLLECTION).filter(i => i.invoiceId !== id));
  },

  duplicate(id: string, newInvoiceNumber: string): Invoice | null {
    const original = this.getById(id);
    if (!original) return null;
    const { id: _id, createdAt: _c, updatedAt: _u, invoiceNumber: _n, pdfPath: _p, items, ...rest } = original;
    return this.create(
      { ...rest, invoiceNumber: newInvoiceNumber, invoiceDate: new Date().toISOString().split('T')[0], status: 'draft' },
      (items ?? []).map(({ id: _iid, invoiceId: _inv, ...item }) => item)
    );
  },

  getNextSequenceNumber(businessId: string): number {
    const sequences = db.getCollection<Sequence>(SEQ_COLLECTION);
    const yearKey = this.getYearKey();
    const existing = sequences.find(s => s.businessId === businessId && s.yearKey === yearKey);
    const business = businessRepository.getById(businessId);
    const startNumber = business?.invoiceStartNumber ?? 1;
    const nextSeq = existing ? existing.lastNumber + 1 : 1;
    return Math.max(nextSeq, startNumber);
  },

  incrementSequence(businessId: string): void {
    const sequences = db.getCollection<Sequence>(SEQ_COLLECTION);
    const yearKey = this.getYearKey();
    const idx = sequences.findIndex(s => s.businessId === businessId && s.yearKey === yearKey);
    if (idx === -1) {
      sequences.push({ businessId, yearKey, lastNumber: 1 });
    } else {
      sequences[idx].lastNumber += 1;
    }
    db.setCollection(SEQ_COLLECTION, sequences);
  },

  getYearKey(): string {
    const now = new Date();
    return now.getFullYear().toString();
  },

  togglePaidStatus(id: string, isPaid: boolean): Invoice | null {
    const invoices = db.getCollection<Invoice>(INV_COLLECTION);
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) return null;
    invoices[idx] = { ...invoices[idx], isPaid, updatedAt: new Date().toISOString() };
    db.setCollection(INV_COLLECTION, invoices);
    return invoices[idx];
  },
};
