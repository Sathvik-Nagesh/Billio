import { create } from 'zustand';
import type { InvoiceFormState, InvoiceItemForm, ThemeOverrides } from '../types';
import type { PaginationMeasurements } from '../lib/utils/pagination';
import { calculateInvoice, calculateLineTotal } from '../lib/utils/calculations';
import { generateId } from '../lib/db';

const defaultItem = (): InvoiceItemForm => ({
  id: generateId(),
  srNo: 1,
  slNo: '',
  productName: '',
  author: '',
  isbn: '',
  quantity: 1,
  unitPrice: 0,
  lineTotal: 0,
});

const defaultState = (): InvoiceFormState => ({
  businessId: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  customerGstin: '',
  customerNotes: '',
  items: [defaultItem()],
  discountType: 'percentage',
  discountValue: 0,
  invoiceLanguage: 'en',
  templateId: 'minimal-modern',
  themeOverrides: {},
  status: 'draft',
  paymentMethod: 'cash',
  paymentStatus: 'paid',
  receivedAmount: 0,
  changeAmount: 0,
  showIsbn: false,
  showSlNo: false,
  showAuthor: false,
});

interface InvoiceStore {
  form: InvoiceFormState;
  calculations: ReturnType<typeof calculateInvoice>;
  editingInvoiceId: string | null;
  paginationMeasurements: PaginationMeasurements | null;
  setPaginationMeasurements: (measurements: PaginationMeasurements | null) => void;
  resetForm: () => void;
  loadInvoice: (form: InvoiceFormState, id: string) => void;
  updateField: <K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) => void;
  updateTheme: (overrides: Partial<ThemeOverrides>) => void;
  setPaymentDetails: (method: 'cash' | 'upi' | 'credit', receivedAmount?: number) => void;
  addItem: () => void;
  addBookItem: (book: { name: string; unitPrice: number; author?: string; isbn?: string }) => void;
  addMultipleBooks: (books: { name: string; unitPrice: number; author?: string; isbn?: string }[]) => void;
  removeItem: (id: string) => void;
  updateItem: <K extends keyof InvoiceItemForm>(id: string, key: K, value: InvoiceItemForm[K]) => void;
  reorderItems: (from: number, to: number) => void;
  toggleShowIsbn: () => void;
  toggleShowSlNo: () => void;
  toggleShowAuthor: () => void;
  setBulkQuantity: (quantity: number) => void;
  setQuickDiscount: (percentage: number) => void;
}

function recalculate(state: InvoiceStore) {
  const items = state.form.items.map((item, idx) => ({
    ...item,
    srNo: idx + 1,
    lineTotal: calculateLineTotal(item.quantity, item.unitPrice),
  }));
  const calculations = calculateInvoice(items, state.form.discountType, state.form.discountValue);
  
  // Calculate change if cash received is entered
  const received = state.form.receivedAmount || 0;
  const changeAmount = state.form.paymentMethod === 'cash' && received >= calculations.grandTotal
    ? Math.round((received - calculations.grandTotal) * 100) / 100
    : 0;

  const form = {
    ...state.form,
    items,
    changeAmount,
  };

  return { form, items, calculations };
}

export const useInvoiceStore = create<InvoiceStore>()((set, get) => ({
  form: defaultState(),
  calculations: calculateInvoice([], 'percentage', 0),
  editingInvoiceId: null,
  paginationMeasurements: null,

  setPaginationMeasurements: (measurements) => set({ paginationMeasurements: measurements }),

  resetForm: () => {
    const form = defaultState();
    set({ form, calculations: calculateInvoice(form.items, form.discountType, form.discountValue), editingInvoiceId: null });
  },

  loadInvoice: (form, id) => {
    // Determine showIsbn from loaded form — if any item has ISBN data, default to showing it
    const hasIsbnData = (form.items ?? []).some(i => i.isbn && i.isbn.trim() !== '');
    const isPublicationTemplate = form.templateId === 'publication-focus';
    const showIsbn = form.showIsbn ?? (hasIsbnData || isPublicationTemplate);

    // Determine showSlNo — if any item has a selection number
    const hasSlNoData = (form.items ?? []).some(i => i.slNo && i.slNo.trim() !== '');
    const showSlNo = form.showSlNo ?? hasSlNoData;

    // Determine showAuthor
    const hasAuthorData = (form.items ?? []).some(i => (i as any).author && (i as any).author.trim() !== '');
    const showAuthor = form.showAuthor ?? hasAuthorData;

    const paymentMethod = form.paymentMethod ?? 'cash';
    const paymentStatus: 'paid' | 'pending' = form.paymentStatus ?? (paymentMethod === 'credit' ? 'pending' : 'paid');
    const receivedAmount = form.receivedAmount ?? 0;
    const changeAmount = form.changeAmount ?? 0;

    const enrichedForm = { ...form, showIsbn, showSlNo, showAuthor, paymentMethod, paymentStatus, receivedAmount, changeAmount };
    const calculations = calculateInvoice(enrichedForm.items, enrichedForm.discountType, enrichedForm.discountValue);
    set({ form: enrichedForm, calculations, editingInvoiceId: id });
  },

  updateField: (key, value) => {
    set(state => {
      const form = { ...state.form, [key]: value };

      // Auto-show ISBN when publication-focus template is selected
      if (key === 'templateId' && value === 'publication-focus') {
        form.showIsbn = true;
      }

      const { calculations, form: updatedForm } = recalculate({ ...state, form });
      return { form: updatedForm, calculations };
    });
  },

  setPaymentDetails: (method, receivedAmount) => {
    set(state => {
      const status: 'paid' | 'pending' = method === 'credit' ? 'pending' : 'paid';
      const received = receivedAmount !== undefined ? receivedAmount : state.form.receivedAmount;
      const form = {
        ...state.form,
        paymentMethod: method,
        paymentStatus: status,
        receivedAmount: received,
      };
      const { calculations, form: updatedForm } = recalculate({ ...state, form });
      return { form: updatedForm, calculations };
    });
  },

  updateTheme: (overrides) => {
    set(state => ({
      form: { ...state.form, themeOverrides: { ...state.form.themeOverrides, ...overrides } },
    }));
  },

  addItem: () => {
    set(state => {
      const items = [...state.form.items, { ...defaultItem(), id: generateId(), srNo: state.form.items.length + 1 }];
      const form = { ...state.form, items };
      const calculations = calculateInvoice(items, form.discountType, form.discountValue);
      return { form, calculations };
    });
  },

  addBookItem: (book) => {
    set(state => {
      let items = [...state.form.items];
      // Check if the only existing item is empty
      if (items.length === 1 && !items[0].productName.trim() && items[0].unitPrice === 0) {
        items[0] = {
          ...items[0],
          productName: book.name,
          unitPrice: book.unitPrice,
          author: book.author || items[0].author || '',
          isbn: book.isbn || items[0].isbn || '',
          quantity: 1,
          lineTotal: book.unitPrice,
        };
      } else {
        items.push({
          ...defaultItem(),
          id: generateId(),
          srNo: items.length + 1,
          productName: book.name,
          unitPrice: book.unitPrice,
          author: book.author || '',
          isbn: book.isbn || '',
          quantity: 1,
          lineTotal: book.unitPrice,
        });
      }
      // Reindex srNo
      items = items.map((it, idx) => ({ ...it, srNo: idx + 1 }));
      const form = { ...state.form, items };
      const calculations = calculateInvoice(items, form.discountType, form.discountValue);
      return { form, calculations };
    });
  },

  addMultipleBooks: (books) => {
    set(state => {
      if (!books.length) return state;
      let items = [...state.form.items];
      // If only 1 item and it's empty, remove it first
      if (items.length === 1 && !items[0].productName.trim() && items[0].unitPrice === 0) {
        items = [];
      }
      for (const book of books) {
        items.push({
          ...defaultItem(),
          id: generateId(),
          srNo: items.length + 1,
          productName: book.name,
          unitPrice: book.unitPrice,
          author: book.author || '',
          isbn: book.isbn || '',
          quantity: 1,
          lineTotal: book.unitPrice,
        });
      }
      items = items.map((it, idx) => ({ ...it, srNo: idx + 1 }));
      const form = { ...state.form, items };
      const calculations = calculateInvoice(items, form.discountType, form.discountValue);
      return { form, calculations };
    });
  },

  setQuickDiscount: (percentage) => {
    set(state => {
      const form = {
        ...state.form,
        discountType: 'percentage' as const,
        discountValue: percentage,
      };
      const { calculations } = recalculate({ ...state, form });
      return { form, calculations };
    });
  },

  removeItem: (id) => {
    set(state => {
      if (state.form.items.length <= 1) return state;
      const items = state.form.items.filter(i => i.id !== id).map((it, idx) => ({ ...it, srNo: idx + 1 }));
      const form = { ...state.form, items };
      const calculations = calculateInvoice(items, form.discountType, form.discountValue);
      return { form, calculations };
    });
  },

  updateItem: (id, key, value) => {
    set(state => {
      const items = state.form.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [key]: value };
        if (key === 'quantity' || key === 'unitPrice') {
          updated.lineTotal = calculateLineTotal(
            key === 'quantity' ? (value as number) : item.quantity,
            key === 'unitPrice' ? (value as number) : item.unitPrice
          );
        }
        return updated;
      });
      const form = { ...state.form, items };
      const calculations = calculateInvoice(items, form.discountType, form.discountValue);
      return { form, calculations };
    });
  },

  reorderItems: (from, to) => {
    set(state => {
      const items = [...state.form.items];
      const [removed] = items.splice(from, 1);
      items.splice(to, 0, removed);
      const reindexed = items.map((it, idx) => ({ ...it, srNo: idx + 1 }));
      const form = { ...state.form, items: reindexed };
      const calculations = calculateInvoice(reindexed, form.discountType, form.discountValue);
      return { form, calculations };
    });
  },

  toggleShowIsbn: () => {
    set(state => {
      const newShowIsbn = !state.form.showIsbn;
      // When hiding ISBN, clear all ISBN values from items
      const items = newShowIsbn
        ? state.form.items
        : state.form.items.map(item => ({ ...item, isbn: '' }));
      return {
        form: { ...state.form, showIsbn: newShowIsbn, items },
      };
    });
  },

  toggleShowSlNo: () => {
    set(state => {
      const newShowSlNo = !state.form.showSlNo;
      // When hiding Sl. No., clear all slNo values from items
      const items = newShowSlNo
        ? state.form.items
        : state.form.items.map(item => ({ ...item, slNo: '' }));
      return {
        form: { ...state.form, showSlNo: newShowSlNo, items },
      };
    });
  },

  toggleShowAuthor: () => {
    set(state => {
      const newShowAuthor = !state.form.showAuthor;
      const items = newShowAuthor
        ? state.form.items
        : state.form.items.map(item => ({ ...item, author: '' }));
      return {
        form: { ...state.form, showAuthor: newShowAuthor, items },
      };
    });
  },

  setBulkQuantity: (quantity: number) => {
    set(state => {
      const items = state.form.items.map(item => ({
        ...item,
        quantity,
        lineTotal: calculateLineTotal(quantity, item.unitPrice)
      }));
      const form = { ...state.form, items };
      const calculations = calculateInvoice(items, form.discountType, form.discountValue);
      return { form, calculations };
    });
  },
}));
