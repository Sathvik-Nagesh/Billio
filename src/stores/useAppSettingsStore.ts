import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppSettingsStore {
  dateFormat: string;
  printFriendly: boolean;
  highContrast: boolean;
  documentLabel: 'invoice' | 'bill';
  whatsappTemplate: string;
  setDateFormat: (fmt: string) => void;
  setPrintFriendly: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setDocumentLabel: (label: 'invoice' | 'bill') => void;
  setWhatsappTemplate: (tpl: string) => void;
}

export const DEFAULT_WHATSAPP_TEMPLATE = `Dear {customer_name},

Please find attached your invoice {invoice_number} for {amount}.

Thank you for your business!
{business_name}`;

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    (set) => ({
      dateFormat: 'DD-MM-YYYY', // Default: Indian format
      printFriendly: false,
      highContrast: false,
      documentLabel: 'invoice',
      whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,

      setDateFormat: (fmt) => set({ dateFormat: fmt }),
      setPrintFriendly: (v) => set({ printFriendly: v }),
      setHighContrast: (v) => set({ highContrast: v }),
      setDocumentLabel: (label) => set({ documentLabel: label }),
      setWhatsappTemplate: (tpl) => set({ whatsappTemplate: tpl }),
    }),
    {
      name: 'billio-app-settings',
    }
  )
);
