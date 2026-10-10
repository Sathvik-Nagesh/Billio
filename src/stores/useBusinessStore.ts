import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Business } from '../types';
import { businessRepository } from '../lib/db/repositories/businessRepository';
import { safeLocalStorage } from '../lib/utils/safeStorage';

interface BusinessStore {
  businesses: Business[];
  activeBusiness: Business | null;
  activeBusinessId: string | null;
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
      activeBusinessId: null,
      isLoaded: false,

      load: () => {
        const businesses = businessRepository.getAll();
        const savedId = get().activeBusinessId;
        const active =
          (savedId ? businesses.find(b => b.id === savedId) : null) ||
          businessRepository.getDefault() ||
          businesses[0] ||
          null;

        set({
          businesses,
          activeBusiness: active,
          activeBusinessId: active?.id ?? null,
          isLoaded: true,
        });
      },

      setActiveBusiness: (id: string) => {
        const biz = get().businesses.find(b => b.id === id) ?? null;
        set({ activeBusiness: biz, activeBusinessId: id });
      },

      createBusiness: (data) => {
        const biz = businessRepository.create(data);
        const businesses = businessRepository.getAll();
        set({ businesses, activeBusiness: biz, activeBusinessId: biz.id });
        return biz;
      },

      updateBusiness: (id, data) => {
        businessRepository.update(id, data);
        const businesses = businessRepository.getAll();
        const activeId = get().activeBusinessId;
        const active = businesses.find(b => b.id === (activeId || id)) || businesses[0] || null;
        set({
          businesses,
          activeBusiness: active,
          activeBusinessId: active?.id ?? null,
        });
      },

      deleteBusiness: (id) => {
        businessRepository.delete(id);
        const businesses = businessRepository.getAll();
        const currentActiveId = get().activeBusinessId;
        const nextActive = currentActiveId === id ? businesses[0] ?? null : businesses.find(b => b.id === currentActiveId) ?? businesses[0] ?? null;
        set({
          businesses,
          activeBusiness: nextActive,
          activeBusinessId: nextActive?.id ?? null,
        });
      },
    }),
    {
      name: 'billio-active-business-id',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ activeBusinessId: state.activeBusinessId }),
    }
  )
);
