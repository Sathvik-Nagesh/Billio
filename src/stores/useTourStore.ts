import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  actionHint?: string;
  route?: string;
}

export const MAIN_APP_TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '#app-header',
    title: 'Welcome to Billio! 👋',
    description: 'This is your top control bar. You can switch between multiple business profiles, toggle dark mode, and manage your account.',
    placement: 'bottom',
    route: '/',
  },
  {
    targetSelector: '#home-new-invoice-btn',
    title: '⚡ Speed-Billing (Alt + N)',
    description: 'Click here or press Alt+N to create a new invoice with instant barcode/title autocomplete, auto-calculations, and zero typing friction.',
    placement: 'bottom',
    actionHint: 'Shortcut: Alt+N',
    route: '/',
  },
  {
    targetSelector: '#home-duplicate-btn',
    title: '📋 1-Click Duplicate Last',
    description: 'Quickly copy the items and customer from your last transaction with an incremented invoice number for fast recurring sales.',
    placement: 'bottom',
    route: '/',
  },
  {
    targetSelector: '#home-daily-tally-btn',
    title: '🧾 Daily Fair Tally (Alt + T)',
    description: 'At the end of a busy book fair or business day, reconcile total cash in drawer, UPI transfers, credit dues, and title quantities in 1 click.',
    placement: 'bottom',
    actionHint: 'Shortcut: Alt+T',
    route: '/',
  },
  {
    targetSelector: '#nav-books',
    title: '📚 Book & Product Catalog',
    description: 'Manage your book inventory, import thousands of titles via CSV, and search instantly by ISBN or barcode.',
    placement: 'right',
    route: '/',
  },
  {
    targetSelector: '#nav-businesses',
    title: '🏢 Business & Invoice Templates',
    description: 'Customize your store name, logo, signature, bank details, and choose from 6 beautiful invoice themes.',
    placement: 'right',
    route: '/',
  },
];

interface TourState {
  isTourActive: boolean;
  currentStepIndex: number;
  hasSeenTour: boolean;
  isHelpModalOpen: boolean;
  activeGuideTab: string;
  
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  endTour: () => void;
  
  openHelpModal: (tab?: string) => void;
  closeHelpModal: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      isTourActive: false,
      currentStepIndex: 0,
      hasSeenTour: false,
      isHelpModalOpen: false,
      activeGuideTab: 'walkthrough',

      startTour: () => {
        set({
          isTourActive: true,
          currentStepIndex: 0,
          isHelpModalOpen: false,
        });
      },

      nextStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex < MAIN_APP_TOUR_STEPS.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 });
        } else {
          get().endTour();
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },

      skipTour: () => {
        set({
          isTourActive: false,
          hasSeenTour: true,
        });
      },

      endTour: () => {
        set({
          isTourActive: false,
          hasSeenTour: true,
          currentStepIndex: 0,
        });
      },

      openHelpModal: (tab = 'walkthrough') => {
        set({
          isHelpModalOpen: true,
          activeGuideTab: tab,
        });
      },

      closeHelpModal: () => {
        set({ isHelpModalOpen: false });
      },
    }),
    {
      name: 'billio-tour-storage',
      partialize: (state) => ({ hasSeenTour: state.hasSeenTour }),
    }
  )
);
