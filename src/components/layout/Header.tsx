import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, FilePlus, ChevronDown } from 'lucide-react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { Button, Select } from '@/components/ui';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { mode, toggleMode } = useThemeStore();
  const { businesses, activeBusiness, setActiveBusiness } = useBusinessStore();
  const navigate = useNavigate();

  return (
    <header
      id="app-header"
      className="flex items-center justify-between px-6 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] no-print shrink-0 h-[60px]"
    >
      <h1 className="text-base font-semibold text-[var(--color-text-primary)] font-display">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        {/* Business Selector */}
        {businesses.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)] hidden sm:block">Business:</span>
            <select
              id="header-business-selector"
              value={activeBusiness?.id ?? ''}
              onChange={(e) => setActiveBusiness(e.target.value)}
              className="h-8 pl-3 pr-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all cursor-pointer"
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
          className="h-9 w-9 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-all duration-150"
          title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
}
