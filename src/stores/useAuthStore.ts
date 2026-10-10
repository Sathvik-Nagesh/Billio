import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/lib/db';
import { businessRepository } from '@/lib/db/repositories/businessRepository';
import { convexClient, isConvexConfigured } from '@/lib/convex/client';
import { convexSyncEngine } from '@/lib/convex/syncEngine';
import { api } from '../../convex/_generated/api';

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
  isGuest: boolean;
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
      isGuest: false,
      hasCompletedOnboarding: false,

      login: async (email: string, passwordOrPin: string) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          return { success: false, error: 'Please enter your email or username' };
        }
        if (!passwordOrPin) {
          return { success: false, error: 'Please enter your password' };
        }

        // 1. Authenticate with Convex Cloud Database if available
        if (isConvexConfigured() && convexClient) {
          try {
            const res = (await convexClient.mutation(api.auth.login, {
              email: cleanEmail,
              password: passwordOrPin,
            })) as any;

            if (res && res.success && res.user) {
              const activeUser: UserProfile = {
                id: res.user.id,
                name: res.user.name,
                email: res.user.email,
                role: res.user.role || 'owner',
                tenantId: res.user.tenantId,
                phone: res.user.phone,
              };

              // Switch active local database tenant namespace
              db.setTenantId(activeUser.tenantId);

              set({
                user: activeUser,
                isAuthenticated: true,
                isOfflineMode: false,
                isGuest: false,
              });

              // Pull tenant data from Convex cloud into local offline cache
              convexSyncEngine.pullCloudToLocal(activeUser.tenantId).catch(console.warn);

              return { success: true };
            }
          } catch (err: any) {
            const msg = err?.message || 'Authentication failed';
            return { success: false, error: msg.replace(/\[CONVEX.*?\]\s*/, '') };
          }
        }

        // 2. Offline Fallback: Verify against cached user profile
        const cached = get().user;
        if (cached && cached.email.toLowerCase() === cleanEmail) {
          set({
            isAuthenticated: true,
            isOfflineMode: true,
            isGuest: false,
          });
          return { success: true };
        }

        return {
          success: false,
          error: 'Convex cloud is offline and no cached credentials were found for this account.',
        };
      },

      signup: async ({ name, email, businessName, password }) => {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanBiz = businessName.trim();

        if (!cleanName || !cleanEmail || !cleanBiz) {
          return { success: false, error: 'Please fill in all required fields' };
        }
        if (!password || password.length < 4) {
          return { success: false, error: 'Password must be at least 4 characters long' };
        }

        // 1. Register with Convex Cloud Database
        if (isConvexConfigured() && convexClient) {
          try {
            const res = (await convexClient.mutation(api.auth.register, {
              name: cleanName,
              email: cleanEmail,
              password,
              businessName: cleanBiz,
            })) as any;

            if (res && res.success && res.user) {
              const activeUser: UserProfile = {
                id: res.user.id,
                name: res.user.name,
                email: res.user.email,
                role: 'owner',
                tenantId: res.user.tenantId,
              };

              db.setTenantId(activeUser.tenantId);

              set({
                user: activeUser,
                isAuthenticated: true,
                isOfflineMode: false,
                isGuest: false,
                hasCompletedOnboarding: false,
              });

              // Pull initial tenant setup into local DB
              convexSyncEngine.pullCloudToLocal(activeUser.tenantId).catch(console.warn);

              return { success: true };
            }
          } catch (err: any) {
            const msg = err?.message || 'Registration failed';
            return { success: false, error: msg.replace(/\[CONVEX.*?\]\s*/, '') };
          }
        }

        // 2. Offline Local Registration Fallback
        const localTenantId = `tenant_${Date.now().toString(36)}`;
        const localUser: UserProfile = {
          id: `user_${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role: 'owner',
          tenantId: localTenantId,
        };

        db.setTenantId(localTenantId);

        businessRepository.create({
          name: cleanBiz,
          email: cleanEmail,
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

        set({
          user: localUser,
          isAuthenticated: true,
          isOfflineMode: true,
          isGuest: false,
          hasCompletedOnboarding: false,
        });

        return { success: true };
      },

      loginAsCashierPin: async (pin: string, name = 'Cashier') => {
        if (pin.length < 4) {
          return { success: false, error: 'PIN must be at least 4 digits' };
        }

        const activeTenantId = get().user?.tenantId || db.getTenantId() || 'tenant_default';

        if (isConvexConfigured() && convexClient) {
          try {
            const res = (await convexClient.mutation(api.auth.loginWithPin, {
              tenantId: activeTenantId,
              pin,
              name,
            })) as any;

            if (res && res.success && res.user) {
              set({
                user: res.user,
                isAuthenticated: true,
                isOfflineMode: false,
                isGuest: false,
              });
              return { success: true };
            }
          } catch (err: any) {
            const msg = err?.message || 'Invalid PIN';
            return { success: false, error: msg.replace(/\[CONVEX.*?\]\s*/, '') };
          }
        }

        const localUser: UserProfile = {
          id: `cashier_${Date.now()}`,
          name: name || 'Cashier Desk',
          email: 'cashier@local.store',
          role: 'cashier',
          tenantId: activeTenantId,
        };

        set({
          user: localUser,
          isAuthenticated: true,
          isOfflineMode: true,
          isGuest: false,
        });

        return { success: true };
      },

      loginOffline: () => {
        const guestTenantId = 'tenant_guest_local';
        const user: UserProfile = {
          id: 'user_guest',
          name: 'Guest Store Admin',
          email: 'guest@billio.local',
          role: 'owner',
          tenantId: guestTenantId,
        };

        db.setTenantId(guestTenantId);

        // Ensure default local demo profile exists for guest
        const existing = businessRepository.getAll();
        if (existing.length === 0) {
          businessRepository.create({
            name: 'Demo Book House',
            email: 'demo@billio.local',
            phone: '+91 98765 43210',
            address: 'Bangalore, Karnataka',
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

        set({
          user,
          isAuthenticated: true,
          isOfflineMode: true,
          isGuest: true,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isOfflineMode: false,
          isGuest: false,
        });
      },

      updateProfile: (data) => {
        const current = get().user;
        if (current) {
          const updated = { ...current, ...data };
          set({ user: updated });
          if (!get().isGuest) {
            convexSyncEngine.syncCurrentUser(updated);
          }
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
