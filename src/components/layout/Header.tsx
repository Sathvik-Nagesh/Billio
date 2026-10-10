import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, FilePlus, Menu, User, LogOut, Sparkles, KeyRound, HelpCircle } from 'lucide-react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTourStore } from '@/stores/useTourStore';
import { Button } from '@/components/ui';
import { toast } from 'sonner';

interface HeaderProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export function Header({ title, onMobileMenuToggle }: HeaderProps) {
  const { mode, toggleMode } = useThemeStore();
  const { businesses, activeBusiness, setActiveBusiness } = useBusinessStore();
  const { user, logout, resetOnboarding } = useAuthStore();
  const { openHelpModal } = useTourStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReplayTour = () => {
    setUserMenuOpen(false);
    resetOnboarding();
    toast.info('Restarting interactive setup wizard...');
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    toast.success('Logged out successfully');
  };

  const isNewInvoicePage = location.pathname === '/invoice/new';

  return (
    <header
      id="app-header"
      className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] no-print shrink-0 h-[56px] sm:h-[60px]"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] font-display truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Business Selector */}
        {businesses.length > 0 && (
          <div className="flex items-center gap-1.5 max-w-[130px] sm:max-w-[200px]">
            <select
              id="header-business-selector"
              value={activeBusiness?.id ?? ''}
              onChange={(e) => setActiveBusiness(e.target.value)}
              className="h-8 pl-2 pr-5 sm:pr-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all cursor-pointer truncate font-medium"
            >
              {businesses.map(biz => (
                <option key={biz.id} value={biz.id}>{biz.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* New Invoice Quick Button (Only on desktop and when not already on New Invoice page) */}
        {!isNewInvoicePage && (
          <Button
            id="header-new-invoice-btn"
            size="sm"
            onClick={() => navigate('/invoice/new')}
            className="hidden md:flex h-8 px-3 text-xs"
          >
            <FilePlus size={13} />
            New Invoice
          </Button>
        )}

        {/* Theme Toggle */}
        <button
          id="theme-toggle"
          onClick={toggleMode}
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
          title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {mode === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Interactive Guide & Walkthrough Trigger */}
        <button
          id="header-help-guide-btn"
          onClick={() => openHelpModal()}
          className="hidden sm:flex h-8 sm:h-9 px-2.5 rounded-lg border border-[var(--color-primary-300)]/40 dark:border-[var(--color-primary-800)]/40 bg-[var(--color-primary-50)]/60 dark:bg-[var(--color-primary-950)]/60 hover:bg-[var(--color-primary-100)]/60 text-[var(--color-primary)] items-center gap-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          title="Interactive Walkthrough & Shortcuts"
        >
          <HelpCircle size={14} />
          <span>Guide</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(prev => !prev)}
            className="flex items-center gap-2 h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] transition-all cursor-pointer"
            title="User Profile & Settings"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={12} />}
            </div>
            <span className="text-xs font-medium max-w-[80px] sm:max-w-[110px] truncate hidden sm:block">
              {user?.name || 'User'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl py-2 z-50 animate-fade-in text-xs">
              <div className="px-3 py-2 border-b border-[var(--color-border)]">
                <div className="font-bold text-[var(--color-text-primary)] truncate">{user?.name || 'Store User'}</div>
                <div className="text-[11px] text-[var(--color-text-muted)] truncate">{user?.email || 'local@billio.app'}</div>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] text-[var(--color-primary)]">
                  {user?.role || 'owner'}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={handleReplayTour}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-left text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  Restart Setup Wizard / Tour
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-left text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
                >
                  <KeyRound size={14} className="text-[var(--color-primary)]" />
                  Store & App Settings
                </button>
              </div>

              <div className="pt-1 border-t border-[var(--color-border)]">
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer font-medium"
                >
                  <LogOut size={14} />
                  Sign Out / Switch User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
