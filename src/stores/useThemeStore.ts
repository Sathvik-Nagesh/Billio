import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  mode: 'light' | 'dark';
  toggleMode: () => void;
  setMode: (mode: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'light',

      toggleMode: () => {
        const next = get().mode === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ mode: next });
      },

      setMode: (mode) => {
        document.documentElement.classList.toggle('dark', mode === 'dark');
        set({ mode });
      },
    }),
    { name: 'billio-theme' }
  )
);
