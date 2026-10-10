import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, FilePlus, FileText, Building2, Settings, BookOpen,
  ChevronLeft, ChevronRight, Zap, X, Sparkles, HelpCircle
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useTenant } from '@/contexts/TenantContext';
import { useTourStore } from '@/stores/useTourStore';
import { Tooltip } from '@/components/ui';

const navItems = [
  { to: '/', icon: Home, label: 'Home', id: 'nav-home' },
  { to: '/invoice/new', icon: FilePlus, label: 'New Invoice', id: 'nav-new-invoice' },
  { to: '/history', icon: FileText, label: 'Invoice History', id: 'nav-history' },
  { to: '/businesses', icon: Building2, label: 'Businesses', id: 'nav-businesses' },
  { to: '/books', icon: BookOpen, label: 'Book Catalog', id: 'nav-books' },
  { to: '/settings', icon: Settings, label: 'Settings', id: 'nav-settings' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { activeBusiness } = useBusinessStore();
  const { branding } = useTenant();
  const { openHelpModal } = useTourStore();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity animate-fade-in"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={`flex flex-col h-full bg-[var(--color-sidebar)] transition-all duration-300 ease-in-out z-50 no-print
          fixed inset-y-0 left-0 md:static pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]
          ${mobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${sidebarCollapsed ? 'md:w-16' : 'md:w-60'}
        `}
      >
        {/* Logo & Mobile Close */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.brandName || 'Brand Logo'}
                className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5 shadow-lg flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)] flex items-center justify-center flex-shrink-0 shadow-lg">
                <Zap size={16} className="text-white" strokeWidth={2.5} />
              </div>
            )}
            {(!sidebarCollapsed || mobileOpen) && (
              <div className="animate-fade-in truncate">
                <span className="text-white font-bold text-lg tracking-tight font-display truncate block">
                  {branding.brandName || 'Billio'}
                </span>
                <div className="text-xs text-[var(--color-primary-300)] font-medium leading-none mt-0.5 truncate">
                  {branding.tagline || 'Invoice Generator'}
                </div>
              </div>
            )}
          </div>
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Active Business Badge */}
        {(!sidebarCollapsed || mobileOpen) && activeBusiness && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 animate-fade-in">
            <div className="text-xs text-[var(--color-sidebar-text)] font-medium truncate leading-none mb-0.5">Active Business</div>
            <div className="text-sm text-white font-semibold truncate">{activeBusiness.name}</div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, id }) => {
            const isCollapsedOnDesktop = sidebarCollapsed && !mobileOpen;

            return isCollapsedOnDesktop ? (
              <Tooltip key={to} content={label}>
                <NavLink
                  to={to}
                  id={id}
                  end={to === '/'}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    `flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--color-sidebar-item-active)] text-[var(--color-sidebar-text-active)]'
                        : 'text-[var(--color-sidebar-text)] hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                </NavLink>
              </Tooltip>
            ) : (
              <NavLink
                key={to}
                to={to}
                id={id}
                end={to === '/'}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 h-10 px-3 rounded-lg transition-all duration-150 text-sm font-medium ${
                    isActive
                      ? 'bg-[var(--color-sidebar-item-active)] text-[var(--color-sidebar-text-active)] shadow-sm'
                      : 'text-[var(--color-sidebar-text)] hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="animate-fade-in truncate">{label}</span>
              </NavLink>
            );
          })}

          {/* Quick Guide & Interactive Tour Item */}
          <div className="pt-2 mt-2 border-t border-white/10">
            {sidebarCollapsed && !mobileOpen ? (
              <Tooltip content="Interactive Guide & Tour">
                <button
                  onClick={() => {
                    if (onMobileClose) onMobileClose();
                    openHelpModal();
                  }}
                  className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-amber-300 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Sparkles size={18} />
                </button>
              </Tooltip>
            ) : (
              <button
                onClick={() => {
                  if (onMobileClose) onMobileClose();
                  openHelpModal();
                }}
                className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-amber-300 hover:bg-white/10 transition-all text-sm font-medium cursor-pointer"
              >
                <Sparkles size={18} className="flex-shrink-0 text-amber-300" />
                <span className="animate-fade-in truncate">Guide & Tour</span>
              </button>
            )}
          </div>
        </nav>

        {/* Collapse Toggle (Desktop only) */}
        <div className="hidden md:block px-2 pb-4 border-t border-white/10 pt-3">
          <button
            onClick={toggleSidebar}
            id="sidebar-toggle"
            className="flex items-center justify-center h-9 w-9 mx-auto rounded-lg text-[var(--color-sidebar-text)] hover:bg-white/10 hover:text-white transition-all duration-150"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Built By */}
        {(!sidebarCollapsed || mobileOpen) && (
          <div className="px-4 pb-4 pt-2 text-center animate-fade-in border-t border-white/10 mt-auto">
            <a
              href="https://www.instagram.com/sathvik_nagesh/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--color-sidebar-text)] hover:text-white transition-colors duration-200"
            >
              Built by <span className="font-semibold underline">Sathvik Nagesh</span>
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
