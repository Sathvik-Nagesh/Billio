import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppSettingsStore {
  dateFormat: string;
  printFriendly: boolean;
  highContrast: boolean;
  documentLabel: 'invoice' | 'bill';
  setDateFormat: (fmt: string) => void;
  setPrintFriendly: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setDocumentLabel: (label: 'invoice' | 'bill') => void;
}

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    (set) => ({
      dateFormat: 'DD-MM-YYYY', // Default: Indian format
      printFriendly: false,
      highContrast: false,
      documentLabel: 'invoice',

      setDateFormat: (fmt) => set({ dateFormat: fmt }),
      setPrintFriendly: (v) => set({ printFriendly: v }),
      setHighContrast: (v) => set({ highContrast: v }),
      setDocumentLabel: (label) => set({ documentLabel: label }),
    }),
    {
      name: 'billio-app-settings',
    }
  )
);
