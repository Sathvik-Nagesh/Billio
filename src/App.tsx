import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { NewInvoicePage } from '@/pages/NewInvoicePage';
import { InvoiceHistoryPage } from '@/pages/InvoiceHistoryPage';
import { BusinessProfilesPage } from '@/pages/BusinessProfilesPage';
import { BusinessFormPage } from '@/pages/BusinessFormPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useThemeStore } from '@/stores/useThemeStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useNavigate } from 'react-router-dom';

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
    // Apply theme on mount
    document.documentElement.classList.toggle('dark', mode === 'dark');
    // Load businesses
    load();
  }, []);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <AppLayout>
        <KeyboardShortcuts />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/invoice/new" element={<NewInvoicePage />} />
          <Route path="/invoice/edit/:id" element={<NewInvoicePage />} />
          <Route path="/history" element={<InvoiceHistoryPage />} />
          <Route path="/businesses" element={<BusinessProfilesPage />} />
          <Route path="/businesses/new" element={<BusinessFormPage />} />
          <Route path="/businesses/edit/:id" element={<BusinessFormPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
