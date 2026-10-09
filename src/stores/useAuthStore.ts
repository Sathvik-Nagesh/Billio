import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { businessRepository } from '@/lib/db/repositories/businessRepository';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'cashier';
  tenantId: string;
  phone?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOfflineMode: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, passwordOrPin: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; businessName: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  loginAsCashierPin: (pin: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginOffline: () => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  resetOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isOfflineMode: false,
      hasCompletedOnboarding: false,

      login: async (email: string, _passwordOrPin: string) => {
        if (!email.trim()) {
          return { success: false, error: 'Please enter your email or username' };
        }

        const user: UserProfile = {
          id: `user_${Date.now()}`,
          name: email.split('@')[0] || 'Store Manager',
          email: email.trim().toLowerCase(),
          role: 'owner',
          tenantId: 'tenant_default',
        };

        set({
          user,
          isAuthenticated: true,
          isOfflineMode: false,
        });

        return { success: true };
      },

      signup: async ({ name, email, businessName }) => {
        if (!name.trim() || !email.trim()) {
          return { success: false, error: 'Please fill in all required fields' };
        }

        const user: UserProfile = {
          id: `user_${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: 'owner',
          tenantId: 'tenant_default',
        };

        // If businessName is provided and no business exists yet, create it
        if (businessName.trim()) {
          const existing = businessRepository.getAll();
          if (existing.length === 0) {
            businessRepository.create({
              name: businessName.trim(),
              email: email.trim(),
              phone: '',
              address: '',
              invoicePrefix: 'INV-',
              invoiceYearFormat: 'none',
              invoiceSeparator: '-',
              invoicePadding: 3,
              invoiceStartNumber: 1,
              isDefault: true,
              templateId: 'minimal-modern',
              accentColor: '#3b82f6',
            });
          }
        }

        set({
          user,
          isAuthenticated: true,
          isOfflineMode: false,
          hasCompletedOnboarding: false,
        });

        return { success: true };
      },

      loginAsCashierPin: async (pin: string, name = 'Cashier') => {
        if (pin.length < 4) {
          return { success: false, error: 'PIN must be at least 4 digits' };
        }

        const user: UserProfile = {
          id: `cashier_${Date.now()}`,
          name: name || 'Cashier Desk',
          email: 'cashier@local.store',
          role: 'cashier',
          tenantId: 'tenant_default',
        };

        set({
          user,
          isAuthenticated: true,
          isOfflineMode: true,
        });

        return { success: true };
      },

      loginOffline: () => {
        const user: UserProfile = {
          id: 'user_offline',
          name: 'Store Admin',
          email: 'admin@billio.local',
          role: 'owner',
          tenantId: 'tenant_default',
        };

        set({
          user,
          isAuthenticated: true,
          isOfflineMode: true,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isOfflineMode: false,
        });
      },

      updateProfile: (data) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...data } });
        }
      },

      setOnboardingCompleted: (completed: boolean) => {
        set({ hasCompletedOnboarding: completed });
      },

      resetOnboarding: () => {
        set({ hasCompletedOnboarding: false });
      },
    }),
    {
      name: 'billio-auth-storage',
    }
  )
);
