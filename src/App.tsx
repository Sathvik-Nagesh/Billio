import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConvexProvider } from '@/lib/convex/ConvexProvider';
import { TenantProvider } from '@/contexts/TenantContext';
import { useThemeStore } from '@/stores/useThemeStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthPage } from '@/components/auth/AuthPage';
import { InteractiveOnboarding } from '@/components/onboarding/InteractiveOnboarding';
import { useNavigate } from 'react-router-dom';

const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const NewInvoicePage = lazy(() => import('@/pages/NewInvoicePage').then(m => ({ default: m.NewInvoicePage })));
const InvoiceHistoryPage = lazy(() => import('@/pages/InvoiceHistoryPage').then(m => ({ default: m.InvoiceHistoryPage })));
const BusinessProfilesPage = lazy(() => import('@/pages/BusinessProfilesPage').then(m => ({ default: m.BusinessProfilesPage })));
const BusinessFormPage = lazy(() => import('@/pages/BusinessFormPage').then(m => ({ default: m.BusinessFormPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BookCatalogPage = lazy(() => import('@/pages/BookCatalogPage').then(m => ({ default: m.BookCatalogPage })));

function RouteLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function KeyboardShortcuts() {
  const navigate = useNavigate();
  const { resetForm } = useInvoiceStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        resetForm();
        navigate('/invoice/new');
      }
      if (e.key === 's' || e.key === 'S') {
        // PDF download — trigger via button click
        e.preventDefault();
        const btn = document.getElementById('invoice-pdf-btn') as HTMLButtonElement | null;
        btn?.click();
      }
      if (e.key === 'p' || e.key === 'P') {
        // Print
        e.preventDefault();
        const btn = document.getElementById('invoice-print-btn') as HTMLButtonElement | null;
        btn?.click();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate, resetForm]);

  return null;
}

function AppInit() {
  const { mode } = useThemeStore();
  const { load } = useBusinessStore();

  useEffect(() => {
    // Apply theme on mount and when mode changes
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  useEffect(() => {
    // Load businesses
    load();

    // Background cloud sync with Convex if connected
    import('./lib/convex/syncEngine').then(({ convexSyncEngine }) => {
      if (convexSyncEngine.isAvailable()) {
        convexSyncEngine.fullSync().then(() => {
          load(); // Refresh businesses if new ones were fetched
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [load]);

  return null;
}

export default function App() {
  const { isAuthenticated, hasCompletedOnboarding } = useAuthStore();

  return (
    <ConvexProvider>
      <TenantProvider>
        <AppInit />
        {!isAuthenticated ? (
          <AuthPage />
        ) : !hasCompletedOnboarding ? (
          <InteractiveOnboarding />
        ) : (
          <HashRouter>
            <AppLayout>
              <KeyboardShortcuts />
              <Suspense fallback={<RouteLoading />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/invoice/new" element={<NewInvoicePage />} />
                  <Route path="/invoice/edit/:id" element={<NewInvoicePage />} />
                  <Route path="/history" element={<InvoiceHistoryPage />} />
                  <Route path="/businesses" element={<BusinessProfilesPage />} />
                  <Route path="/businesses/new" element={<BusinessFormPage />} />
                  <Route path="/businesses/edit/:id" element={<BusinessFormPage />} />
                  <Route path="/books" element={<BookCatalogPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </AppLayout>
          </HashRouter>
        )}
      </TenantProvider>
    </ConvexProvider>
  );
}
