import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, QrCode, Clock, BookOpen, Share2, Receipt, RefreshCw, Sparkles } from 'lucide-react';
import { invoiceRepository } from '@/lib/db/repositories/invoiceRepository';
import { formatINR, formatNumber } from '@/lib/utils/currency';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { toast } from 'sonner';

interface DailyFairTallyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export function DailyFairTallyModal({ isOpen, onClose, defaultDate }: DailyFairTallyModalProps) {
  const { activeBusiness } = useBusinessStore();
  const [selectedDate, setSelectedDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState(invoiceRepository.getDailyFairStats(selectedDate, activeBusiness?.id));

  const refreshStats = () => {
    setStats(invoiceRepository.getDailyFairStats(selectedDate, activeBusiness?.id));
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
    }
  }, [isOpen, selectedDate, activeBusiness]);

  if (!isOpen) return null;

  const handleShareOnWhatsApp = () => {
    const text = `📊 *Daily Fair Sales Report* 📊\n` +
      `📅 Date: ${stats.date}\n` +
      `🏢 Business: ${activeBusiness?.name || 'Publication'}\n` +
      `-----------------------------\n` +
      `💰 *Total Revenue: ${formatINR(stats.totalRevenue)}*\n` +
      `🧾 Total Bills: ${stats.totalInvoices}\n` +
      `📚 Total Books Sold: ${stats.totalBooks}\n` +
      `-----------------------------\n` +
      `💵 Cash Collected: ${formatINR(stats.totalCash)}\n` +
      `📱 UPI / Online: ${formatINR(stats.totalUpi)}\n` +
      `⏳ Credit / Pending: ${formatINR(stats.totalCredit)}\n` +
      `-----------------------------\n` +
      `Generated with Billio`;

    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
    toast.success('Opening WhatsApp with daily report');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-[calc(100vw-24px)] max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold shrink-0">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">Daily Fair Sales Tally</h3>
              <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)]">Reconcile today's cash in hand & UPI collections</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={refreshStats}
              className="p-1.5 sm:p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
              title="Refresh stats"
            >
              <RefreshCw size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Date Selector Banner */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
            <Calendar size={14} className="text-[var(--color-primary)]" />
            <span>Select Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="h-8 px-2 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
          {/* Main Total Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-700)] text-white shadow-md">
            <div className="text-[11px] sm:text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">
              Total Revenue ({stats.totalInvoices} Bills • {stats.totalBooks} Books)
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">{formatINR(stats.totalRevenue)}</div>
          </div>

          {/* 3 Metric Cards: Cash vs UPI vs Credit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {/* Cash */}
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-0.5 sm:mb-1">
                <DollarSign size={14} />
                <span>Cash in Hand</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-emerald-900 dark:text-emerald-300">
                {formatINR(stats.totalCash)}
              </div>
            </div>

            {/* UPI */}
            <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-xs mb-0.5 sm:mb-1">
                <QrCode size={14} />
                <span>UPI / Online</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-blue-900 dark:text-blue-300">
                {formatINR(stats.totalUpi)}
              </div>
            </div>

            {/* Credit / Pending */}
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs mb-0.5 sm:mb-1">
                <Clock size={14} />
                <span>Credit / Due</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-amber-900 dark:text-amber-300">
                {formatINR(stats.totalCredit)}
              </div>
            </div>
          </div>

          {/* Today's Transactions List */}
          <div>
            <div className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2 flex items-center justify-between">
              <span>Today's Invoices ({stats.invoices.length})</span>
              <span className="text-[10px] text-[var(--color-text-muted)] font-normal">Auto-recorded</span>
            </div>

            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden divide-y divide-[var(--color-border-light)] max-h-56 overflow-y-auto">
              {stats.invoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                  No sales recorded on this date yet.
                </div>
              ) : (
                stats.invoices.map(inv => {
                  const method = inv.paymentMethod || 'cash';
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 hover:bg-[var(--color-surface-secondary)]/50 transition-colors">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[var(--color-text-primary)] truncate">
                            {inv.customerName || 'Walk-in Customer'}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                            #{inv.invoiceNumber}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)]">
                          {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          method === 'cash' 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : method === 'upi'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          {method}
                        </span>
                        <span className="text-xs font-extrabold text-[var(--color-text-primary)]">
                          {formatINR(inv.grandTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleShareOnWhatsApp}
            disabled={stats.totalInvoices === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-xs"
          >
            <Share2 size={14} />
            <span>Share Report on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
