import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'sonner';

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/invoice/new': 'New Invoice',
  '/history': 'Invoice History',
  '/businesses': 'Business Profiles',
  '/businesses/new': 'New Business',
  '/settings': 'Settings',
};

function getTitle(pathname: string): string {
  if (pathname.startsWith('/invoice/edit/')) return 'Edit Invoice';
  if (pathname.startsWith('/businesses/edit/')) return 'Edit Business';
  return pageTitles[pathname] ?? 'Billio';
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-surface-secondary)]">
        <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      </div>
    </>
  );
}
