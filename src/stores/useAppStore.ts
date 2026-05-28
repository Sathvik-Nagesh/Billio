import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStore {
  sidebarCollapsed: boolean;
  currentEditInvoiceId: string | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setCurrentEditInvoiceId: (id: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      currentEditInvoiceId: null,

      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setCurrentEditInvoiceId: (id) => set({ currentEditInvoiceId: id }),
    }),
    {
      name: 'billio-app-state',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
