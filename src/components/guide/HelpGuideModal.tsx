import React, { useState } from 'react';
import {
  HelpCircle, Sparkles, BookOpen, Receipt, Keyboard, FileText,
  Smartphone, Printer, Shield, ChevronRight, X, Play, CheckCircle2,
  Search, ExternalLink, ArrowRight
} from 'lucide-react';
import { useTourStore } from '@/stores/useTourStore';
import { Button, Card, Badge } from '@/components/ui';

interface GuideItem {
  id: string;
  title: string;
  category: 'billing' | 'fair' | 'catalog' | 'sharing' | 'settings';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge: string;
  summary: string;
  steps: string[];
  hotkeys?: string[];
  proTip?: string;
}

const GUIDES: GuideItem[] = [
  {
    id: 'speed-billing',
    title: '5-Second POS Speed-Billing',
    category: 'billing',
    icon: FileText,
    badge: 'Fastest Workflow',
    summary: 'Create, calculate, and finalize invoices in under 5 seconds during busy fair rushes with zero mouse clicks.',
    steps: [
      'Press Alt+N anywhere in the app to open a blank New Invoice.',
      'Type the book title or scan the ISBN barcode in the Item field — details and unit price autocomplete immediately.',
      'Enter the quantity and press Enter to jump to the next line item.',
      'Select payment mode (💵 Cash, 📱 UPI, or ⏳ Credit) or enter received amount to compute exact change.',
      'Press Ctrl+S to save and download the PDF, or click WhatsApp to send an instant itemized receipt.',
    ],
    hotkeys: ['Alt + N (New Invoice)', 'Enter (Next Line)', 'Ctrl + S (Save & PDF)'],
    proTip: 'For repeat customers or batch orders, click "Duplicate Last" on the Home Dashboard to copy items and advance sequence numbers instantly.',
  },
  {
    id: 'daily-tally',
    title: 'Daily Fair Tally & Cash Reconciliation',
    category: 'fair',
    icon: Receipt,
    badge: 'Fair Closing',
    summary: 'Reconcile cash in drawer, UPI collections, pending dues, and titles sold at the end of each exhibition day.',
    steps: [
      'Press Alt+T or click "Daily Fair Tally" on the Home dashboard.',
      'Select the fair date (defaults to today) and choose the active business profile.',
      'Review total sales, cash collected, UPI collections, and credit receivables.',
      'Inspect the Book Title Breakdown table showing exact quantities sold per book.',
      'Export the complete tally summary to Excel CSV or print a closing summary receipt.',
    ],
    hotkeys: ['Alt + T (Open Daily Tally)'],
    proTip: 'Daily Fair Tally is calculated offline in memory and works even if internet cuts out on the fairground.',
  },
  {
    id: 'catalog-import',
    title: 'Book Catalog & Barcode Management',
    category: 'catalog',
    icon: BookOpen,
    badge: 'Inventory',
    summary: 'Import thousands of publication titles, authors, and prices in bulk with high-speed CSV parsing.',
    steps: [
      'Navigate to "Book Catalog" from the sidebar menu.',
      'Click "Import CSV" and choose your publication inventory spreadsheet (columns: Title, Author, Price, ISBN).',
      'The engine automatically processes up to 10,000 items in a single batch.',
      'Use the fast search bar to filter by title, author, or ISBN barcode in real-time.',
    ],
    proTip: 'Pressing Enter while typing a title in the invoice form will automatically suggest matches from this catalog.',
  },
  {
    id: 'whatsapp-pdf',
    title: '1-Click WhatsApp Invoicing & Thermal Printing',
    category: 'sharing',
    icon: Smartphone,
    badge: 'Customer Delivery',
    summary: 'Send instant itemized WhatsApp receipts to customer phone numbers without printing paper.',
    steps: [
      'Enter the buyer\'s 10-digit mobile number in the Customer details section.',
      'Click "WhatsApp" or "Download & Share" on the top action bar.',
      'The app pre-fills a professional WhatsApp message with invoice number, amount, payment mode, and publisher details.',
      'For counter thermal printing, press Ctrl+P or click Print to render the compact thermal receipt layout.',
    ],
    hotkeys: ['Ctrl + P (Print Invoice)'],
    proTip: 'You can customize the default WhatsApp greeting message anytime in Settings > WhatsApp Settings.',
  },
  {
    id: 'offline-backup',
    title: 'Offline Security & ZIP Backups',
    category: 'settings',
    icon: Shield,
    badge: 'Data Safety',
    summary: 'Protect all your invoices, customer directories, and catalogs with 1-click encrypted ZIP backups.',
    steps: [
      'Open "Settings" from the navigation sidebar.',
      'Under "Data & Backup", click "Backup" to download an instant `Billio_Backup_YYYY-MM-DD.zip` archive.',
      'Store this archive on a USB drive or cloud drive before updating devices.',
      'To restore, click "Restore", select your backup ZIP, and confirm data reload.',
    ],
    proTip: 'Billio automatically takes an emergency backup before any software update or data restore operation.',
  },
];

const KEYBOARD_SHORTCUTS = [
  { key: 'Alt + N', action: 'Create New Invoice (Speed-Billing)', category: 'Billing' },
  { key: 'Alt + T', action: 'Open Daily Fair Tally & Cash Reconciliation', category: 'Reports' },
  { key: 'Ctrl + N', action: 'Reset & Start Fresh Invoice', category: 'Billing' },
  { key: 'Ctrl + S', action: 'Save Invoice & Download PDF', category: 'Actions' },
  { key: 'Ctrl + P', action: 'Print Invoice / Thermal Layout', category: 'Actions' },
  { key: 'Enter', action: 'Select Catalog Suggestion / Add Item Row', category: 'Editor' },
  { key: 'Esc', action: 'Close Modal / Cancel Action', category: 'Global' },
];

export function HelpGuideModal() {
  const { isHelpModalOpen, closeHelpModal, startTour, activeGuideTab } = useTourStore();
  const [selectedGuideId, setSelectedGuideId] = useState<string>('speed-billing');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'guides' | 'shortcuts' | 'faqs'>(
    (activeGuideTab as any) || 'guides'
  );

  if (!isHelpModalOpen) return null;

  const selectedGuide = GUIDES.find(g => g.id === selectedGuideId) || GUIDES[0];

  const filteredGuides = GUIDES.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] text-white flex items-center justify-center shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] font-display flex items-center gap-2">
                Billio Interactive Guide & Walkthrough
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Master speed-billing, daily tallies, catalog search, and hotkeys
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={startTour}
              className="gap-1.5 shadow-xs bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-500)] text-white text-xs font-semibold"
            >
              <Play size={13} fill="currentColor" /> Start Live App Tour
            </Button>
            <button
              onClick={closeHelpModal}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('guides')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'guides'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-bold'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            📚 Interactive Walkthroughs
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'shortcuts'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-bold'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            ⌨️ Keyboard Shortcuts
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'faqs'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-bold'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            💡 Pro Tips & FAQs
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          {/* TAB 1: GUIDES */}
          {activeTab === 'guides' && (
            <>
              {/* Sidebar Guide List */}
              <div className="w-full md:w-80 border-r border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 p-4 overflow-y-auto space-y-2 shrink-0">
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search guides..."
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  />
                </div>

                {filteredGuides.map(g => {
                  const Icon = g.icon;
                  const isSelected = g.id === selectedGuideId;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGuideId(g.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-surface)] border-[var(--color-primary)] shadow-sm'
                          : 'bg-[var(--color-surface)]/60 border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isSelected
                            ? 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] text-[var(--color-primary)]'
                            : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]'
                        }`}>
                          {g.badge}
                        </span>
                        <ChevronRight size={14} className={isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'} />
                      </div>
                      <div className="text-xs font-bold text-[var(--color-text-primary)] mb-0.5">
                        {g.title}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                        {g.summary}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Guide Detail Panel */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[var(--color-surface)]">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] text-[var(--color-primary)] uppercase tracking-wider">
                      {selectedGuide.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
                    {selectedGuide.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    {selectedGuide.summary}
                  </p>
                </div>

                {/* Hotkeys Banner */}
                {selectedGuide.hotkeys && (
                  <div className="p-3 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">Key Shortcuts:</span>
                    {selectedGuide.hotkeys.map(k => (
                      <kbd key={k} className="px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono font-bold text-[var(--color-primary)] shadow-xs">
                        {k}
                      </kbd>
                    ))}
                  </div>
                )}

                {/* Step by Step Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Step-by-Step Instructions:
                  </h4>
                  <div className="space-y-2.5">
                    {selectedGuide.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)]">
                        <div className="w-6 h-6 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Tip */}
                {selectedGuide.proTip && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-start gap-3">
                    <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                        Pro Performance Tip
                      </span>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                        {selectedGuide.proTip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[var(--color-surface)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Speed-Billing Keyboard Shortcuts
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Operate the entire POS and billing workflow without touching the mouse.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {KEYBOARD_SHORTCUTS.map(s => (
                  <div key={s.key} className="p-3.5 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[var(--color-text-primary)]">{s.action}</div>
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{s.category}</span>
                    </div>
                    <kbd className="px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono font-bold text-[var(--color-primary)] shadow-xs shrink-0">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PRO TIPS & FAQS */}
          {activeTab === 'faqs' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[var(--color-surface)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Frequently Asked Questions & Pro Tips
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Helpful tips for publication houses, exhibition stalls, and multi-tenant setups.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Does Billio work when there is no internet at the book fair ground?
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Yes! Billio is built completely offline-first. All data, catalogs, customer lists, and invoices are saved instantly in local memory and disk, and sync with the cloud when connection is restored.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    How do I switch between English and Kannada bilingual receipt formats?
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    When editing an invoice (or setting your business profile defaults), simply toggle the Language switch between "English", "ಕನ್ನಡ", or "Bilingual". All labels and headers will update in real-time.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    How can I restart the initial setup wizard or live walkthrough?
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Click your Profile icon in the top header or go to Settings and click "Restart Setup Wizard / Tour". You can also click the "Start Live App Tour" button in this modal anytime.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex items-center justify-between text-xs text-[var(--color-text-muted)] shrink-0">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono">Esc</kbd> to close</span>
          <Button size="sm" variant="outline" onClick={closeHelpModal}>
            Close Guide
          </Button>
        </div>
      </div>
    </div>
  );
}
