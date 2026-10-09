import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { InteractiveTour } from '../guide/InteractiveTour';
import { HelpGuideModal } from '../guide/HelpGuideModal';
import { Toaster } from 'sonner';

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/invoice/new': 'New Invoice',
  '/history': 'Invoice History',
  '/businesses': 'Business Profiles',
  '/businesses/new': 'New Business',
  '/books': 'Book Catalog',
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
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex h-screen w-full overflow-hidden bg-[var(--color-surface-secondary)] relative">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full">
          <Header title={title} onMobileMenuToggle={() => setMobileOpen(prev => !prev)} />
          <main className="flex-1 overflow-hidden relative">
            {children}
          </main>
        </div>
      </div>

      {/* Global Interactive Walkthrough & Spotlight Tour */}
      <InteractiveTour />
      <HelpGuideModal />
    </>
  );
}
