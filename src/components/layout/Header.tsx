import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, FilePlus, Menu } from 'lucide-react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { Button } from '@/components/ui';

interface HeaderProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export function Header({ title, onMobileMenuToggle }: HeaderProps) {
  const { mode, toggleMode } = useThemeStore();
  const { businesses, activeBusiness, setActiveBusiness } = useBusinessStore();
  const navigate = useNavigate();

  return (
    <header
      id="app-header"
      className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] no-print shrink-0 h-[60px]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 -ml-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-base font-semibold text-[var(--color-text-primary)] font-display truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Business Selector */}
        {businesses.length > 0 && (
          <div className="flex items-center gap-2 max-w-[140px] sm:max-w-xs">
            <span className="text-xs text-[var(--color-text-muted)] hidden md:block">Business:</span>
            <select
              id="header-business-selector"
              value={activeBusiness?.id ?? ''}
              onChange={(e) => setActiveBusiness(e.target.value)}
              className="h-8 pl-2 pr-6 sm:pl-3 sm:pr-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all cursor-pointer truncate"
            >
              {businesses.map(biz => (
                <option key={biz.id} value={biz.id}>{biz.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* New Invoice Quick Button */}
        <Button
          id="header-new-invoice-btn"
          size="sm"
          onClick={() => navigate('/invoice/new')}
          className="hidden sm:flex"
        >
          <FilePlus size={14} />
          New Invoice
        </Button>

        {/* Theme Toggle */}
        <button
          id="theme-toggle"
          onClick={toggleMode}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-all duration-150 cursor-pointer"
          title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
}
