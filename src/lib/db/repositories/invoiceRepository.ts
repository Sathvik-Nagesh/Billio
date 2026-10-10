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
    // Fast sort using ISO string comparison (avoids redundant Date object instantiation)
    return invoices.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  getById(id: string): Invoice | null {
    const invoices = db.getCollection<Invoice>(INV_COLLECTION);
    const inv = invoices.find(i => i.id === id);
    if (!inv) return null;
    return {
      ...inv,
      items: this.getItems(id),
    };
  },

  getItems(invoiceId: string): InvoiceItem[] {
    const allItems = db.getCollection<InvoiceItem>(ITEM_COLLECTION);
    const items: InvoiceItem[] = [];
    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].invoiceId === invoiceId) {
        items.push(allItems[i]);
      }
    }
    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  search(query: string, businessId?: string, startDate?: string, endDate?: string): Invoice[] {
    const invoices = db.getCollection<Invoice>(INV_COLLECTION);
    const q = query.trim().toLowerCase();

    // Fast filter first
    const matched = invoices.filter(i => {
      if (businessId && i.businessId !== businessId) return false;
      if (startDate && i.invoiceDate < startDate) return false;
      if (endDate && i.invoiceDate > endDate) return false;
      if (q) {
        const numMatch = i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(q);
        const nameMatch = i.customerName && i.customerName.toLowerCase().includes(q);
        const addrMatch = i.customerAddress && i.customerAddress.toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !addrMatch) return false;
      }
      return true;
    });

    // Sort only the matched subset
    return matched.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  create(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>, items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]): Invoice {
    const now = new Date().toISOString();
    const id = generateId();
    const invoice: Invoice = { ...data, id, createdAt: now, updatedAt: now };

    const invoices = db.getCollection<Invoice>(INV_COLLECTION);
    invoices.push(invoice);
    db.setCollection(INV_COLLECTION, invoices);

    const allItems = db.getCollection<InvoiceItem>(ITEM_COLLECTION);
    for (let i = 0; i < items.length; i++) {
      allItems.push({ ...items[i], id: generateId(), invoiceId: id, sortOrder: i });
    }
    db.setCollection(ITEM_COLLECTION, allItems);

    this.incrementSequence(data.businessId);

    // Asynchronously sync to Convex cloud
    import('../../convex/syncEngine').then(({ convexSyncEngine }) => {
      convexSyncEngine.syncInvoice(invoice, allItems.filter(i => i.invoiceId === id));
    }).catch(() => {});

    return invoice;
  },

  update(id: string, data: Partial<Invoice>, items?: Omit<InvoiceItem, 'id' | 'invoiceId'>[]): Invoice | null {
    const invoices = db.getCollection<Invoice>(INV_COLLECTION);
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) return null;

    invoices[idx] = { ...invoices[idx], ...data, id, updatedAt: new Date().toISOString() };
    db.setCollection(INV_COLLECTION, invoices);

    if (items !== undefined) {
      const remainingItems = db.getCollection<InvoiceItem>(ITEM_COLLECTION).filter(i => i.invoiceId !== id);
      for (let i = 0; i < items.length; i++) {
        remainingItems.push({ ...items[i], id: generateId(), invoiceId: id, sortOrder: i });
      }
      db.setCollection(ITEM_COLLECTION, remainingItems);
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
    return new Date().getFullYear().toString();
  },

  togglePaidStatus(id: string, isPaid: boolean): Invoice | null {
    const invoices = db.getCollection<Invoice>(INV_COLLECTION);
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) return null;
    invoices[idx] = { ...invoices[idx], isPaid, paymentStatus: isPaid ? 'paid' : 'pending', updatedAt: new Date().toISOString() };
    db.setCollection(INV_COLLECTION, invoices);
    return invoices[idx];
  },

  /**
   * High-speed Single-Pass Daily Fair Stats calculation.
   * O(N + M) complexity instead of O(N * M) nested table scans.
   */
  getDailyFairStats(dateStr?: string, businessId?: string) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const invoices = db.getCollection<Invoice>(INV_COLLECTION);

    const targetInvoices: Invoice[] = [];
    const targetInvoiceIds = new Set<string>();

    let totalRevenue = 0;
    let totalCash = 0;
    let totalUpi = 0;
    let totalCredit = 0;

    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      if (inv.invoiceDate === targetDate && (!businessId || inv.businessId === businessId)) {
        targetInvoices.push(inv);
        targetInvoiceIds.add(inv.id);
        totalRevenue += inv.grandTotal;

        const method = inv.paymentMethod || 'cash';
        if (method === 'cash') totalCash += inv.grandTotal;
        else if (method === 'upi') totalUpi += inv.grandTotal;
        else if (method === 'credit') totalCredit += inv.grandTotal;
      }
    }

    // Single pass over items
    let totalBooks = 0;
    if (targetInvoiceIds.size > 0) {
      const allItems = db.getCollection<InvoiceItem>(ITEM_COLLECTION);
      for (let i = 0; i < allItems.length; i++) {
        if (targetInvoiceIds.has(allItems[i].invoiceId)) {
          totalBooks += allItems[i].quantity || 1;
        }
      }
    }

    return {
      date: targetDate,
      totalRevenue,
      totalInvoices: targetInvoices.length,
      totalCash,
      totalUpi,
      totalCredit,
      totalBooks,
      invoices: targetInvoices.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    };
  },
};
