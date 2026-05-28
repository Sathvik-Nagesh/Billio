import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Business } from '../types';
import { businessRepository } from '../lib/db/repositories/businessRepository';

interface BusinessStore {
  businesses: Business[];
  activeBusiness: Business | null;
  isLoaded: boolean;
  load: () => void;
  setActiveBusiness: (id: string) => void;
  createBusiness: (data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => Business;
  updateBusiness: (id: string, data: Partial<Business>) => void;
  deleteBusiness: (id: string) => void;
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set, get) => ({
      businesses: [],
      activeBusiness: null,
      isLoaded: false,

      load: () => {
        const businesses = businessRepository.getAll();
        const defaultBiz = businessRepository.getDefault();
        set({ businesses, activeBusiness: defaultBiz, isLoaded: true });
      },

      setActiveBusiness: (id: string) => {
        const biz = get().businesses.find(b => b.id === id) ?? null;
        set({ activeBusiness: biz });
      },

      createBusiness: (data) => {
        const biz = businessRepository.create(data);
        const businesses = businessRepository.getAll();
        set({ businesses, activeBusiness: biz });
        return biz;
      },

      updateBusiness: (id, data) => {
        businessRepository.update(id, data);
        const businesses = businessRepository.getAll();
        const active = get().activeBusiness;
        set({
          businesses,
          activeBusiness: active?.id === id
            ? businesses.find(b => b.id === id) ?? active
            : active,
        });
      },

      deleteBusiness: (id) => {
        businessRepository.delete(id);
        const businesses = businessRepository.getAll();
        const active = get().activeBusiness;
        set({
          businesses,
          activeBusiness: active?.id === id ? businesses[0] ?? null : active,
        });
      },
    }),
    {
      name: 'billio-active-business',
      partialize: (state) => ({ activeBusiness: state.activeBusiness }),
    }
  )
);
