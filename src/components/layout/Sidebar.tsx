import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, FilePlus, FileText, Building2, Settings,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { Tooltip } from '@/components/ui';

const navItems = [
  { to: '/', icon: Home, label: 'Home', id: 'nav-home' },
  { to: '/invoice/new', icon: FilePlus, label: 'New Invoice', id: 'nav-new-invoice' },
  { to: '/history', icon: FileText, label: 'Invoice History', id: 'nav-history' },
  { to: '/businesses', icon: Building2, label: 'Businesses', id: 'nav-businesses' },
  { to: '/settings', icon: Settings, label: 'Settings', id: 'nav-settings' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { activeBusiness } = useBusinessStore();

  return (
    <aside
      id="app-sidebar"
      className={`flex flex-col h-full bg-[var(--color-sidebar)] transition-all duration-300 ease-in-out relative z-30 no-print ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)] flex items-center justify-center flex-shrink-0 shadow-lg">
          <Zap size={16} className="text-white" strokeWidth={2.5} />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in">
            <span className="text-white font-bold text-lg tracking-tight font-display">Billio</span>
            <div className="text-xs text-[var(--color-primary-300)] font-medium leading-none mt-0.5">Invoice Generator</div>
          </div>
        )}
      </div>

      {/* Active Business Badge */}
      {!sidebarCollapsed && activeBusiness && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 animate-fade-in">
          <div className="text-xs text-[var(--color-sidebar-text)] font-medium truncate leading-none mb-0.5">Active Business</div>
          <div className="text-sm text-white font-semibold truncate">{activeBusiness.name}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, id }) => (
          sidebarCollapsed ? (
            <Tooltip key={to} content={label}>
              <NavLink
                to={to}
                id={id}
                end={to === '/'}
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
          )
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 pb-4 border-t border-white/10 pt-3">
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
      {!sidebarCollapsed && (
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
  );
}
