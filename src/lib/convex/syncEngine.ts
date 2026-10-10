import { convexClient, isConvexConfigured } from './client';
import { api } from '../../../convex/_generated/api';
import { db } from '../db';
import { syncBooksToIndexedDB } from '../db/indexedDB';
import { useAuthStore } from '@/stores/useAuthStore';
import { optimizeImage } from '@/lib/utils/imageOptimizer';
import type { Business, Book, Customer, Invoice, InvoiceItem } from '@/types';

export interface SyncStats {
  businessesSynced: number;
  booksSynced: number;
  customersSynced: number;
  invoicesSynced: number;
  usersSynced: number;
  lastSyncedAt: string | null;
  error?: string;
}

let lastSyncTime: string | null = null;
let isSyncing = false;

/**
 * Ensures images sent to Convex stay well below the 1MB document limit
 * Compresses raw base64 data URLs to ~15-40KB WebP/PNG
 */
async function prepareSyncImage(img?: string): Promise<string | undefined> {
  if (!img) return undefined;
  if (!img.startsWith('data:image')) return img;
  if (img.length < 50000) return img; // Under ~35KB is already tiny

  try {
    const optimized = await optimizeImage(img, {
      maxWidth: 320,
      maxHeight: 320,
      quality: 0.65,
      format: 'image/webp',
    });
    // If still large, try smaller dimensions
    if (optimized.length > 100000) {
      return await optimizeImage(img, {
        maxWidth: 200,
        maxHeight: 200,
        quality: 0.5,
        format: 'image/jpeg',
      });
    }
    return optimized;
  } catch (err) {
    console.warn('[ConvexSync] Image optimization fallback:', err);
    return img.length > 150000 ? undefined : img;
  }
}

export const convexSyncEngine = {
  isAvailable(): boolean {
    return isConvexConfigured() && convexClient !== null;
  },

  getLastSyncTime(): string | null {
    return lastSyncTime || localStorage.getItem('billio_convex_last_sync');
  },

  /**
   * Push all local database items + user account into Convex cloud
   */
  async pushLocalToCloud(tenantId = db.getTenantId()): Promise<SyncStats> {
    if (!this.isAvailable() || !convexClient) {
      return {
        businessesSynced: 0,
        booksSynced: 0,
        customersSynced: 0,
        invoicesSynced: 0,
        usersSynced: 0,
        lastSyncedAt: null,
        error: 'Convex is not configured or offline',
      };
    }

    const auth = useAuthStore.getState();
    if (auth.isGuest || tenantId === 'tenant_guest_local') {
      return {
        businessesSynced: 0,
        booksSynced: 0,
        customersSynced: 0,
        invoicesSynced: 0,
        usersSynced: 0,
        lastSyncedAt: null,
        error: 'Guest / Offline mode: Data is kept purely local.',
      };
    }

    const stats: SyncStats = {
      businessesSynced: 0,
      booksSynced: 0,
      customersSynced: 0,
      invoicesSynced: 0,
      usersSynced: 0,
      lastSyncedAt: null,
    };

    try {
      // 1. Push Logged-in User Account
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.email) {
        try {
          await convexClient.mutation(api.users.syncUser, {
            tenantId,
            name: currentUser.name || 'Store User',
            email: currentUser.email,
            role: currentUser.role || 'owner',
            phone: currentUser.phone,
            tokenIdentifier: currentUser.id,
          });
          stats.usersSynced++;
        } catch (e) {
          console.warn('[ConvexSync] push user failed:', currentUser.email, e);
        }
      }

      // Also push any users collection items if stored in DB
      const localUsers = db.getCollection<{ name: string; email: string; role?: any; phone?: string }>('users' as any);
      for (const u of localUsers) {
        if (u.email && u.email !== currentUser?.email) {
          try {
            await convexClient.mutation(api.users.syncUser, {
              tenantId,
              name: u.name || 'User',
              email: u.email,
              role: u.role || 'owner',
              phone: u.phone,
            });
            stats.usersSynced++;
          } catch (e) {
            console.warn('[ConvexSync] push local user failed:', u.email, e);
          }
        }
      }

      // 2. Push Businesses (with image optimization to stay far below 1MB limit)
      const localBusinesses = db.getCollection<Business>('businesses');
      for (const b of localBusinesses) {
        try {
          const [logoPath, signaturePath, sealPath, upiQrPath] = await Promise.all([
            prepareSyncImage(b.logoPath),
            prepareSyncImage(b.signaturePath),
            prepareSyncImage(b.sealPath),
            prepareSyncImage(b.upiQrPath),
          ]);

          await convexClient.mutation(api.businesses.create, {
            tenantId,
            name: b.name,
            logoPath,
            address: b.address,
            gstin: b.gstin,
            phone: b.phone,
            email: b.email,
            bankName: b.bankName,
            bankAccount: b.bankAccount,
            bankIfsc: b.bankIfsc,
            bankBranch: b.bankBranch,
            upiId: b.upiId,
            upiQrPath,
            terms: b.terms,
            signaturePath,
            sealPath,
            invoicePrefix: b.invoicePrefix,
            invoiceYearFormat: (b.invoiceYearFormat || 'none') as any,
            invoiceSeparator: b.invoiceSeparator || '-',
            invoicePadding: b.invoicePadding ?? 3,
            invoiceStartNumber: b.invoiceStartNumber ?? 1,
            accentColor: b.accentColor || '#6366f1',
            templateId: b.templateId || 'minimal-modern',
            isDefault: Boolean(b.isDefault),
          });
          stats.businessesSynced++;
        } catch (e) {
          console.warn('[ConvexSync] push business failed:', b.name, e);
        }
      }

      // 3. Push Books
      const localBooks = db.getCollection<Book>('books');
      for (const book of localBooks) {
        try {
          await convexClient.mutation(api.books.upsert, {
            tenantId,
            name: book.name,
            unitPrice: book.unitPrice,
            author: book.author,
            isbn: book.isbn,
          });
          stats.booksSynced++;
        } catch (e) {
          console.warn('[ConvexSync] push book failed:', book.name, e);
        }
      }

      // 4. Push Customers
      const localCustomers = db.getCollection<Customer>('customers');
      for (const cust of localCustomers) {
        try {
          await convexClient.mutation(api.customers.upsertByName, {
            tenantId,
            name: cust.name,
            phone: cust.phone,
            email: cust.email,
            address: cust.address,
            gstin: cust.gstin,
            notes: cust.notes,
          });
          stats.customersSynced++;
        } catch (e) {
          console.warn('[ConvexSync] push customer failed:', cust.name, e);
        }
      }

      // 5. Push Invoices
      const localInvoices = db.getCollection<Invoice>('invoices');
      const localItems = db.getCollection<InvoiceItem>('invoice_items');

      for (const inv of localInvoices) {
        try {
          const invItems = localItems
            .filter((i) => i.invoiceId === inv.id)
            .map((i, idx) => ({
              srNo: idx + 1,
              slNo: i.slNo || undefined,
              productName: i.productName,
              author: i.author || undefined,
              isbn: i.isbn || undefined,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              lineTotal: i.lineTotal,
            }));

          await convexClient.mutation(api.invoices.create, {
            tenantId,
            businessId: inv.businessId,
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.invoiceDate,
            dueDate: inv.dueDate || undefined,
            customerName: inv.customerName,
            customerPhone: inv.customerPhone || undefined,
            customerEmail: inv.customerEmail || undefined,
            customerAddress: inv.customerAddress || undefined,
            customerGstin: inv.customerGstin || undefined,
            customerNotes: inv.customerNotes || undefined,
            subtotal: inv.subtotal,
            discountType: inv.discountType || 'percentage',
            discountValue: inv.discountValue ?? 0,
            discountAmount: inv.discountAmount ?? 0,
            roundOff: inv.roundOff ?? 0,
            grandTotal: inv.grandTotal,
            amountInWords: inv.amountInWords || undefined,
            templateId: inv.templateId || 'minimal-modern',
            themeOverrides: inv.themeOverrides || undefined,
            invoiceLanguage: (inv.invoiceLanguage || 'en') as 'en' | 'kn',
            status: (inv.status || 'final') as 'draft' | 'final',
            isPaid: inv.isPaid,
            paymentMethod: (inv.paymentMethod || 'cash') as any,
            paymentStatus: (inv.paymentStatus || 'paid') as any,
            receivedAmount: inv.receivedAmount || 0,
            changeAmount: inv.changeAmount || 0,
            items: invItems,
          });
          stats.invoicesSynced++;
        } catch (e) {
          console.warn('[ConvexSync] push invoice failed:', inv.invoiceNumber, e);
        }
      }

      const now = new Date().toISOString();
      lastSyncTime = now;
      localStorage.setItem('billio_convex_last_sync', now);
      stats.lastSyncedAt = now;
      return stats;
    } catch (err: any) {
      console.error('[ConvexSync] push error:', err);
      stats.error = err?.message || 'Sync failed';
      return stats;
    }
  },

  /**
   * Pull cloud data from Convex into local storage
   */
  async pullCloudToLocal(tenantId = db.getTenantId()): Promise<SyncStats> {
    if (!this.isAvailable() || !convexClient) {
      return {
        businessesSynced: 0,
        booksSynced: 0,
        customersSynced: 0,
        invoicesSynced: 0,
        usersSynced: 0,
        lastSyncedAt: null,
        error: 'Convex is not configured or offline',
      };
    }

    const stats: SyncStats = {
      businessesSynced: 0,
      booksSynced: 0,
      customersSynced: 0,
      invoicesSynced: 0,
      usersSynced: 0,
      lastSyncedAt: null,
    };

    try {
      // 1. Pull Users
      const cloudUsers = (await convexClient.query(api.users.list, { tenantId })) as any[];
      if (cloudUsers && cloudUsers.length > 0) {
        stats.usersSynced = cloudUsers.length;
        const currentLocalUser = useAuthStore.getState().user;
        if (!currentLocalUser || !currentLocalUser.email) {
          const firstUser = cloudUsers[0];
          useAuthStore.getState().updateProfile({
            id: firstUser._id || firstUser.tokenIdentifier,
            name: firstUser.name,
            email: firstUser.email,
            role: firstUser.role || 'owner',
            phone: firstUser.phone,
          });
        }
      }

      // 2. Pull Businesses
      const cloudBusinesses = (await convexClient.query(api.businesses.list, { tenantId })) as any[];
      if (cloudBusinesses && cloudBusinesses.length > 0) {
        const localBusinesses = db.getCollection<Business>('businesses');
        const map = new Map<string, Business>();
        localBusinesses.forEach((b) => map.set(b.name.toLowerCase(), b));

        for (const cb of cloudBusinesses) {
          const key = cb.name.toLowerCase();
          const existing = map.get(key);
          const mapped: Business = {
            id: cb._id,
            name: cb.name,
            logoPath: cb.logoPath,
            address: cb.address,
            gstin: cb.gstin,
            phone: cb.phone,
            email: cb.email,
            bankName: cb.bankName,
            bankAccount: cb.bankAccount,
            bankIfsc: cb.bankIfsc,
            bankBranch: cb.bankBranch,
            upiId: cb.upiId,
            upiQrPath: cb.upiQrPath,
            terms: cb.terms,
            signaturePath: cb.signaturePath,
            sealPath: cb.sealPath,
            invoicePrefix: cb.invoicePrefix,
            invoiceYearFormat: cb.invoiceYearFormat,
            invoiceSeparator: cb.invoiceSeparator,
            invoicePadding: cb.invoicePadding,
            invoiceStartNumber: cb.invoiceStartNumber,
            accentColor: cb.accentColor,
            templateId: cb.templateId,
            isDefault: cb.isDefault,
            createdAt: cb.createdAt || new Date().toISOString(),
            updatedAt: cb.updatedAt || new Date().toISOString(),
          };
          map.set(key, { ...(existing || {}), ...mapped });
          stats.businessesSynced++;
        }
        db.setCollection('businesses', Array.from(map.values()));
      }

      // 3. Pull Books
      const cloudBooks = (await convexClient.query(api.books.list, { tenantId })) as any[];
      if (cloudBooks && cloudBooks.length > 0) {
        const localBooks = db.getCollection<Book>('books');
        const map = new Map<string, Book>();
        localBooks.forEach((b) => map.set(b.name.toLowerCase(), b));

        for (const cb of cloudBooks) {
          const key = cb.name.toLowerCase();
          const existing = map.get(key);
          const mapped: Book = {
            id: cb._id,
            name: cb.name,
            author: cb.author,
            isbn: cb.isbn,
            unitPrice: cb.unitPrice,
            usageCount: Math.max(existing?.usageCount || 0, cb.usageCount || 0),
            createdAt: cb.createdAt || new Date().toISOString(),
            updatedAt: cb.updatedAt || new Date().toISOString(),
          };
          map.set(key, mapped);
          stats.booksSynced++;
        }
        const mergedBooks = Array.from(map.values());
        db.setCollection('books', mergedBooks);
        syncBooksToIndexedDB(mergedBooks).catch(() => {});
      }

      // 4. Pull Customers
      const cloudCustomers = (await convexClient.query(api.customers.list, { tenantId })) as any[];
      if (cloudCustomers && cloudCustomers.length > 0) {
        const localCustomers = db.getCollection<Customer>('customers');
        const map = new Map<string, Customer>();
        localCustomers.forEach((c) => map.set(c.name.toLowerCase(), c));

        for (const cc of cloudCustomers) {
          const key = cc.name.toLowerCase();
          const existing = map.get(key);
          const mapped: Customer = {
            id: cc._id,
            name: cc.name,
            phone: cc.phone,
            email: cc.email,
            address: cc.address,
            gstin: cc.gstin,
            notes: cc.notes,
            createdAt: cc.createdAt || new Date().toISOString(),
            updatedAt: cc.updatedAt || new Date().toISOString(),
          };
          map.set(key, { ...(existing || {}), ...mapped });
          stats.customersSynced++;
        }
        db.setCollection('customers', Array.from(map.values()));
      }

      // 5. Pull Invoices
      const cloudInvoices = (await convexClient.query(api.invoices.list, { tenantId })) as any[];
      if (cloudInvoices && cloudInvoices.length > 0) {
        const localInvoices = db.getCollection<Invoice>('invoices');
        const map = new Map<string, Invoice>();
        localInvoices.forEach((i) => map.set(i.invoiceNumber, i));

        for (const ci of cloudInvoices) {
          const mapped: Invoice = {
            id: ci._id,
            businessId: ci.businessId,
            invoiceNumber: ci.invoiceNumber,
            invoiceDate: ci.invoiceDate,
            dueDate: ci.dueDate,
            customerId: ci.customerId,
            customerName: ci.customerName,
            customerPhone: ci.customerPhone,
            customerEmail: ci.customerEmail,
            customerAddress: ci.customerAddress,
            customerGstin: ci.customerGstin,
            customerNotes: ci.customerNotes,
            subtotal: ci.subtotal,
            discountType: ci.discountType,
            discountValue: ci.discountValue,
            discountAmount: ci.discountAmount,
            roundOff: ci.roundOff,
            grandTotal: ci.grandTotal,
            amountInWords: ci.amountInWords,
            templateId: ci.templateId,
            themeOverrides: ci.themeOverrides,
            invoiceLanguage: ci.invoiceLanguage,
            pdfPath: ci.pdfPath,
            status: ci.status,
            isPaid: ci.isPaid,
            paymentMethod: ci.paymentMethod,
            paymentStatus: ci.paymentStatus,
            receivedAmount: ci.receivedAmount,
            changeAmount: ci.changeAmount,
            createdAt: ci.createdAt || new Date().toISOString(),
            updatedAt: ci.updatedAt || new Date().toISOString(),
          };
          map.set(ci.invoiceNumber, mapped);
          stats.invoicesSynced++;
        }
        db.setCollection('invoices', Array.from(map.values()));
      }

      const now = new Date().toISOString();
      lastSyncTime = now;
      localStorage.setItem('billio_convex_last_sync', now);
      stats.lastSyncedAt = now;
      return stats;
    } catch (err: any) {
      console.error('[ConvexSync] pull error:', err);
      stats.error = err?.message || 'Pull failed';
      return stats;
    }
  },

  /**
   * Bi-directional 2-way sync
   */
  async fullSync(tenantId = db.getTenantId()): Promise<SyncStats> {
    if (isSyncing) {
      return {
        businessesSynced: 0,
        booksSynced: 0,
        customersSynced: 0,
        invoicesSynced: 0,
        usersSynced: 0,
        lastSyncedAt: this.getLastSyncTime(),
      };
    }

    isSyncing = true;
    try {
      // 0. Deduplicate any accumulated business records to keep payload small
      if (this.isAvailable() && convexClient) {
        try {
          for (let i = 0; i < 3; i++) {
            const res = (await convexClient.mutation(api.businesses.deduplicate, { tenantId })) as any;
            if (!res || res.deletedCount === 0) break;
          }
        } catch (e) {
          console.warn('[ConvexSync] Deduplication notice:', e);
        }
      }

      // 1. Pull cloud data first
      const pullStats = await this.pullCloudToLocal(tenantId);
      // 2. Push any local records up
      const pushStats = await this.pushLocalToCloud(tenantId);

      return {
        businessesSynced: Math.max(pullStats.businessesSynced, pushStats.businessesSynced),
        booksSynced: Math.max(pullStats.booksSynced, pushStats.booksSynced),
        customersSynced: Math.max(pullStats.customersSynced, pushStats.customersSynced),
        invoicesSynced: Math.max(pullStats.invoicesSynced, pushStats.invoicesSynced),
        usersSynced: Math.max(pullStats.usersSynced, pushStats.usersSynced),
        lastSyncedAt: new Date().toISOString(),
        error: pullStats.error || pushStats.error,
      };
    } finally {
      isSyncing = false;
    }
  },

  /**
   * Asynchronously push user account profile to Convex
   */
  syncCurrentUser(user?: { name: string; email: string; role?: any; phone?: string; id?: string }, tenantId = db.getTenantId()) {
    if (!this.isAvailable() || !convexClient) return;
    const auth = useAuthStore.getState();
    if (auth.isGuest || tenantId === 'tenant_guest_local') return;

    const targetUser = user || auth.user;
    if (!targetUser || !targetUser.email) return;

    convexClient
      .mutation(api.users.syncUser, {
        tenantId,
        name: targetUser.name || 'Store User',
        email: targetUser.email,
        role: targetUser.role || 'owner',
        phone: targetUser.phone,
        tokenIdentifier: targetUser.id || `user_${targetUser.email}`,
      })
      .catch((err) => {
        console.warn('[ConvexSync] async syncCurrentUser error:', err);
      });
  },

  /**
   * Asynchronously push a newly created or updated invoice to Convex
   */
  syncInvoice(invoice: Invoice, items: InvoiceItem[], tenantId = db.getTenantId()) {
    if (!this.isAvailable() || !convexClient) return;
    const auth = useAuthStore.getState();
    if (auth.isGuest || tenantId === 'tenant_guest_local') return;

    const invItems = items.map((i, idx) => ({
      srNo: idx + 1,
      slNo: i.slNo || undefined,
      productName: i.productName,
      author: i.author || undefined,
      isbn: i.isbn || undefined,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    }));

    convexClient
      .mutation(api.invoices.create, {
        tenantId,
        businessId: invoice.businessId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate || undefined,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone || undefined,
        customerEmail: invoice.customerEmail || undefined,
        customerAddress: invoice.customerAddress || undefined,
        customerGstin: invoice.customerGstin || undefined,
        customerNotes: invoice.customerNotes || undefined,
        subtotal: invoice.subtotal,
        discountType: invoice.discountType || 'percentage',
        discountValue: invoice.discountValue ?? 0,
        discountAmount: invoice.discountAmount ?? 0,
        roundOff: invoice.roundOff ?? 0,
        grandTotal: invoice.grandTotal,
        amountInWords: invoice.amountInWords || undefined,
        templateId: invoice.templateId || 'minimal-modern',
        themeOverrides: invoice.themeOverrides || undefined,
        invoiceLanguage: (invoice.invoiceLanguage || 'en') as 'en' | 'kn',
        status: (invoice.status || 'final') as 'draft' | 'final',
        isPaid: invoice.isPaid,
        paymentMethod: (invoice.paymentMethod || 'cash') as any,
        paymentStatus: (invoice.paymentStatus || 'paid') as any,
        receivedAmount: invoice.receivedAmount || 0,
        changeAmount: invoice.changeAmount || 0,
        items: invItems,
      })
      .catch((err) => {
        console.warn('[ConvexSync] async syncInvoice error:', err);
      });
  },

  /**
   * Asynchronously push a newly created book to Convex
   */
  syncBook(book: { name: string; unitPrice: number; author?: string; isbn?: string }, tenantId = db.getTenantId()) {
    if (!this.isAvailable() || !convexClient) return;
    const auth = useAuthStore.getState();
    if (auth.isGuest || tenantId === 'tenant_guest_local') return;

    convexClient
      .mutation(api.books.upsert, {
        tenantId,
        name: book.name,
        unitPrice: book.unitPrice,
        author: book.author,
        isbn: book.isbn,
      })
      .catch((err) => {
        console.warn('[ConvexSync] async syncBook error:', err);
      });
  },

  /**
   * Asynchronously push a business profile to Convex
   */
  async syncBusiness(business: Business, tenantId = db.getTenantId()) {
    if (!this.isAvailable() || !convexClient) return;
    const auth = useAuthStore.getState();
    if (auth.isGuest || tenantId === 'tenant_guest_local') return;

    try {
      const [logoPath, signaturePath, sealPath, upiQrPath] = await Promise.all([
        prepareSyncImage(business.logoPath),
        prepareSyncImage(business.signaturePath),
        prepareSyncImage(business.sealPath),
        prepareSyncImage(business.upiQrPath),
      ]);

      convexClient
        .mutation(api.businesses.create, {
          tenantId,
          name: business.name,
          logoPath,
          address: business.address,
          gstin: business.gstin,
          phone: business.phone,
          email: business.email,
          bankName: business.bankName,
          bankAccount: business.bankAccount,
          bankIfsc: business.bankIfsc,
          bankBranch: business.bankBranch,
          upiId: business.upiId,
          upiQrPath,
          terms: business.terms,
          signaturePath,
          sealPath,
          invoicePrefix: business.invoicePrefix,
          invoiceYearFormat: (business.invoiceYearFormat || 'none') as any,
          invoiceSeparator: business.invoiceSeparator || '-',
          invoicePadding: business.invoicePadding ?? 3,
          invoiceStartNumber: business.invoiceStartNumber ?? 1,
          accentColor: business.accentColor || '#6366f1',
          templateId: business.templateId || 'minimal-modern',
          isDefault: Boolean(business.isDefault),
        })
        .catch((err) => {
          console.warn('[ConvexSync] async syncBusiness error:', err);
        });
    } catch (err) {
      console.warn('[ConvexSync] syncBusiness image processing error:', err);
    }
  },
};
