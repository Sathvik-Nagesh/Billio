import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FilePlus, Copy, Eye, Trash2, FileText, Search, Calendar, Receipt, DollarSign, QrCode, Clock } from 'lucide-react';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import { invoiceRepository } from '@/lib/db/repositories/invoiceRepository';
import { businessRepository } from '@/lib/db/repositories/businessRepository';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { DailyFairTallyModal } from '@/components/invoice/DailyFairTallyModal';
import { generateInvoiceNumber } from '@/lib/utils/invoiceNumber';
import { formatINR } from '@/lib/utils/currency';
import type { Invoice, Business } from '@/types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { businesses, activeBusiness } = useBusinessStore();
  const { resetForm, loadInvoice } = useInvoiceStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [chartData, setChartData] = useState<{name: string, total: number}[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isTallyOpen, setIsTallyOpen] = useState(false);

  const loadStats = useCallback(() => {
    const all = invoiceRepository.getAll();
    setTotalCount(all.length);
    setInvoices(all.slice(0, 15)); // Last 15 for recent list
    
    // Prepare 6-month buckets
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const buckets: { year: number; month: number; name: string; total: number; key: string }[] = [];
    const monthKeyMap = new Map<string, number>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${m}`;
      const idx = buckets.length;
      buckets.push({
        year: y,
        month: m,
        name: d.toLocaleString('default', { month: 'short' }),
        total: 0,
        key,
      });
      monthKeyMap.set(key, idx);
    }

    let totalRev = 0;
    let paid = 0;
    let unpaid = 0;

    for (let i = 0; i < all.length; i++) {
      const inv = all[i];
      const gt = inv.grandTotal || 0;
      totalRev += gt;
      if (inv.isPaid) {
        paid += gt;
      } else {
        unpaid += gt;
      }

      // Fast month lookup
      if (inv.invoiceDate) {
        const parts = inv.invoiceDate.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1; // 0-indexed
          const key = `${y}-${m}`;
          const bIdx = monthKeyMap.get(key);
          if (bIdx !== undefined) {
            buckets[bIdx].total += gt;
          }
        }
      }
    }
    
    setTotalRevenue(totalRev);
    setTotalPaid(paid);
    setTotalUnpaid(unpaid);
    setChartData(buckets);
    setLoading(false);
  }, []);

  // Reload stats every time this page is navigated to
  useEffect(() => { loadStats(); }, [location.key]);

  // Also reload on window focus (catches updates made in other windows)
  useEffect(() => {
    window.addEventListener('focus', loadStats);
    return () => window.removeEventListener('focus', loadStats);
  }, [loadStats]);

  const handleNewInvoice = () => {
    resetForm();
    navigate('/invoice/new');
  };

  const handleDuplicateLast = () => {
    if (!activeBusiness) {
      alert('Please set up a business profile first.');
      return;
    }
    const last = invoiceRepository.getAll()[0];
    if (!last) {
      handleNewInvoice();
      return;
    }
    const nextNum = invoiceRepository.getNextSequenceNumber(activeBusiness.id);
    const newNumber = generateInvoiceNumber(activeBusiness, nextNum);
    const dup = invoiceRepository.duplicate(last.id, newNumber);
    if (dup) {
      const fullDup = invoiceRepository.getById(dup.id);
      if (fullDup) {
        const hasIsbnData = (fullDup.items ?? []).some(i => i.isbn && i.isbn.trim() !== '');
        const hasSlNoData = (fullDup.items ?? []).some(i => i.slNo && i.slNo.trim() !== '');
        const formState = {
          businessId: fullDup.businessId,
          invoiceNumber: fullDup.invoiceNumber,
          invoiceDate: fullDup.invoiceDate,
          dueDate: fullDup.dueDate ?? '',
          customerName: fullDup.customerName,
          customerPhone: fullDup.customerPhone ?? '',
          customerEmail: fullDup.customerEmail ?? '',
          customerAddress: fullDup.customerAddress ?? '',
          customerGstin: fullDup.customerGstin ?? '',
          customerNotes: fullDup.customerNotes ?? '',
          items: (fullDup.items ?? []).map(i => ({ id: i.id, srNo: i.srNo, slNo: i.slNo ?? '', productName: i.productName, author: i.author ?? '', isbn: i.isbn ?? '', quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
          discountType: fullDup.discountType,
          discountValue: fullDup.discountValue,
          invoiceLanguage: fullDup.invoiceLanguage,
          templateId: fullDup.templateId ?? 'minimal-modern',
          themeOverrides: fullDup.themeOverrides ?? {},
          status: 'draft' as const,
          paymentMethod: fullDup.paymentMethod ?? 'cash',
          paymentStatus: fullDup.paymentStatus ?? (fullDup.isPaid ? 'paid' : 'pending'),
          receivedAmount: fullDup.receivedAmount ?? 0,
          changeAmount: fullDup.changeAmount ?? 0,
          showIsbn: hasIsbnData || fullDup.templateId === 'publication-focus',
          showSlNo: hasSlNoData,
          showAuthor: (fullDup.items ?? []).some(i => i.author && i.author.trim() !== ''),
        };
        loadInvoice(formState, fullDup.id);
        navigate('/invoice/new');
      }
    }
  };

  const handleView = (inv: Invoice) => {
    const full = invoiceRepository.getById(inv.id);
    if (!full) return;
    const hasIsbnData = (full.items ?? []).some(i => i.isbn && i.isbn.trim() !== '');
    const hasSlNoData = (full.items ?? []).some(i => i.slNo && i.slNo.trim() !== '');
    const formState = {
      businessId: full.businessId,
      invoiceNumber: full.invoiceNumber,
      invoiceDate: full.invoiceDate,
      dueDate: full.dueDate ?? '',
      customerName: full.customerName,
      customerPhone: full.customerPhone ?? '',
      customerEmail: full.customerEmail ?? '',
      customerAddress: full.customerAddress ?? '',
      customerGstin: full.customerGstin ?? '',
      customerNotes: full.customerNotes ?? '',
      items: (full.items ?? []).map(i => ({ id: i.id, srNo: i.srNo, slNo: i.slNo ?? '', productName: i.productName, author: i.author ?? '', isbn: i.isbn ?? '', quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
      discountType: full.discountType,
      discountValue: full.discountValue,
      invoiceLanguage: full.invoiceLanguage,
      templateId: full.templateId ?? 'minimal-modern',
      themeOverrides: full.themeOverrides ?? {},
      status: full.status,
      paymentMethod: full.paymentMethod ?? 'cash',
      paymentStatus: full.paymentStatus ?? (full.isPaid ? 'paid' : 'pending'),
      receivedAmount: full.receivedAmount ?? 0,
      changeAmount: full.changeAmount ?? 0,
      showIsbn: hasIsbnData || full.templateId === 'publication-focus',
      showSlNo: hasSlNoData,
      showAuthor: (full.items ?? []).some(i => i.author && i.author.trim() !== ''),
    };
    loadInvoice(formState, full.id);
    navigate('/invoice/new');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    invoiceRepository.delete(id);
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const getBusiness = (id: string): Business | null =>
    businesses.find(b => b.id === id) ?? null;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 animate-fade-in">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <button
          id="home-new-invoice-btn"
          onClick={handleNewInvoice}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] p-4 sm:p-5 text-white text-left transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <FilePlus size={24} className="mb-2 relative z-10" strokeWidth={1.5} />
          <div className="text-base sm:text-lg font-bold relative z-10">New Invoice</div>
          <div className="text-xs text-white/70 relative z-10 mt-0.5">Speed billing & PDF generator</div>
          <div className="mt-2 text-xs text-white/50 relative z-10 font-mono">Alt+N</div>
        </button>

        <button
          id="home-duplicate-btn"
          onClick={handleDuplicateLast}
          className="group relative overflow-hidden rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-5 text-left transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xs hover:shadow-md cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] rounded-full -translate-y-8 translate-x-8 opacity-50" />
          <Copy size={24} className="mb-2 text-[var(--color-primary)] relative z-10" strokeWidth={1.5} />
          <div className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] relative z-10">Duplicate Last</div>
          <div className="text-xs text-[var(--color-text-secondary)] relative z-10 mt-0.5">Copy last invoice with next number</div>
          <div className="mt-2 text-xs text-[var(--color-text-muted)] relative z-10">Quick repeat billing</div>
        </button>

        <button
          id="home-daily-tally-btn"
          onClick={() => setIsTallyOpen(true)}
          className="group relative overflow-hidden rounded-2xl bg-[var(--color-surface)] border border-emerald-300 dark:border-emerald-800 p-4 sm:p-5 text-left transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xs hover:shadow-md cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-950 rounded-full -translate-y-8 translate-x-8 opacity-60" />
          <Receipt size={24} className="mb-2 text-emerald-600 dark:text-emerald-400 relative z-10" strokeWidth={1.5} />
          <div className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] relative z-10">Daily Fair Tally</div>
          <div className="text-xs text-[var(--color-text-secondary)] relative z-10 mt-0.5">Reconcile cash in hand & UPI</div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold relative z-10 font-mono">Alt+T</div>
        </button>
      </div>

      {/* Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex flex-col gap-3 sm:gap-4">
          <Card className="p-4 sm:p-6 flex flex-col justify-center bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex-1 rounded-2xl">
            <div className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 sm:mb-2">Total Revenue (All Time)</div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] tracking-tight truncate">
              {formatINR(totalRevenue)}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1.5 sm:mt-2 font-medium">
              Across {totalCount} total invoices
            </div>
          </Card>
          
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            <Card className="p-3 sm:p-4 flex flex-col justify-center bg-[var(--color-surface)] border border-emerald-300 dark:border-emerald-800 shadow-xs rounded-xl">
              <div className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Paid Invoices</div>
              <div className="text-sm sm:text-xl font-black text-emerald-800 dark:text-emerald-300 truncate" title={formatINR(totalPaid)}>{formatINR(totalPaid)}</div>
            </Card>
            <Card className="p-3 sm:p-4 flex flex-col justify-center bg-[var(--color-surface)] border border-rose-300 dark:border-rose-800 shadow-xs rounded-xl">
              <div className="text-[11px] sm:text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">Pending Due</div>
              <div className="text-sm sm:text-xl font-black text-rose-800 dark:text-rose-300 truncate" title={formatINR(totalUnpaid)}>{formatINR(totalUnpaid)}</div>
            </Card>
          </div>
        </div>
        
        <Card className="p-3.5 sm:p-4 lg:col-span-2 h-[200px] sm:h-[220px] lg:h-auto lg:min-h-[220px] flex flex-col justify-between">
          <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 sm:mb-4 ml-1 sm:ml-2 uppercase tracking-wider">Revenue Trend (Last 6 Months)</div>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
                  formatter={(value: any) => [formatINR(value as number), 'Revenue']}
                  labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Invoices */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Invoices</h2>
        <button
          onClick={() => navigate('/history')}
          className="text-xs text-[var(--color-primary)] hover:underline font-semibold"
        >
          View all →
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : invoices.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" strokeWidth={1} />
          <div className="text-base font-semibold text-[var(--color-text-primary)] mb-1">No invoices yet</div>
          <div className="text-sm text-[var(--color-text-muted)] mb-6">Create your first invoice to get started</div>
          <Button id="home-first-invoice-btn" onClick={handleNewInvoice}>
            <FilePlus size={14} /> Create First Invoice
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => {
            const biz = getBusiness(inv.businessId);
            const method = inv.paymentMethod || 'cash';
            return (
              <div
                key={inv.id}
                className="group flex items-center gap-3 sm:gap-4 px-3.5 sm:px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary-300)] hover:shadow-sm transition-all animate-fade-in-up"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: biz?.accentColor ? `${biz.accentColor}20` : 'var(--color-primary-50)' }}>
                  <FileText size={17} style={{ color: biz?.accentColor ?? 'var(--color-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] truncate max-w-[130px] sm:max-w-none">{inv.customerName}</span>
                    <Badge variant="default" className="text-[10px] sm:text-xs shrink-0">{inv.invoiceNumber}</Badge>
                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      method === 'cash'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : method === 'upi'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}>
                      {method}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-0.5">
                    <span className="flex items-center gap-1"><Calendar size={10} />{inv.invoiceDate}</span>
                    {biz && <span className="truncate max-w-[100px] sm:max-w-none">{biz.name}</span>}
                  </div>
                </div>
                <div className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] shrink-0">{formatINR(inv.grandTotal)}</div>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleView(inv)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition-all cursor-pointer"
                    title="View/Edit"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Fair Tally Modal */}
      {isTallyOpen && (
        <DailyFairTallyModal
          isOpen={isTallyOpen}
          onClose={() => setIsTallyOpen(false)}
        />
      )}
    </div>
  );
}
