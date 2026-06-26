import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, Copy, Eye, Trash2, FileText, Search, Calendar } from 'lucide-react';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import { invoiceRepository } from '@/lib/db/repositories/invoiceRepository';
import { businessRepository } from '@/lib/db/repositories/businessRepository';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { generateInvoiceNumber } from '@/lib/utils/invoiceNumber';
import { formatINR } from '@/lib/utils/currency';
import type { Invoice, Business } from '@/types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function HomePage() {
  const navigate = useNavigate();
  const { businesses, activeBusiness } = useBusinessStore();
  const { resetForm, loadInvoice } = useInvoiceStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [chartData, setChartData] = useState<{name: string, total: number}[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const all = invoiceRepository.getAll();
    setInvoices(all.slice(0, 15)); // Last 15 for recent list
    
    // Calculate total revenue all-time or for current year? The user said "Total Revenue"
    const totalRev = all.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const paid = all.filter(inv => inv.isPaid).reduce((sum, inv) => sum + inv.grandTotal, 0);
    const unpaid = all.filter(inv => !inv.isPaid).reduce((sum, inv) => sum + inv.grandTotal, 0);
    
    setTotalRevenue(totalRev);
    setTotalPaid(paid);
    setTotalUnpaid(unpaid);

    // Calculate revenue trends for last 6 months
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { 
        year: d.getFullYear(), 
        month: d.getMonth(), 
        name: d.toLocaleString('default', { month: 'short' }),
        total: 0 
      };
    });

    all.forEach(inv => {
      const d = new Date(inv.invoiceDate);
      const m = last6Months.find(x => x.year === d.getFullYear() && x.month === d.getMonth());
      if (m) m.total += inv.grandTotal;
    });

    setChartData(last6Months);
    setLoading(false);
  }, []);

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
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          id="home-new-invoice-btn"
          onClick={handleNewInvoice}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] p-6 text-white text-left transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <FilePlus size={32} className="mb-3 relative z-10" strokeWidth={1.5} />
          <div className="text-xl font-bold relative z-10">New Invoice</div>
          <div className="text-sm text-white/70 relative z-10 mt-1">Create a fresh invoice from scratch</div>
          <div className="mt-3 text-xs text-white/50 relative z-10">Ctrl+N</div>
        </button>

        <button
          id="home-duplicate-btn"
          onClick={handleDuplicateLast}
          className="group relative overflow-hidden rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 text-left transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] rounded-full -translate-y-8 translate-x-8 opacity-50" />
          <Copy size={32} className="mb-3 text-[var(--color-primary)] relative z-10" strokeWidth={1.5} />
          <div className="text-xl font-bold text-[var(--color-text-primary)] relative z-10">Duplicate Last</div>
          <div className="text-sm text-[var(--color-text-secondary)] relative z-10 mt-1">Copy last invoice with a new number</div>
          <div className="mt-3 text-xs text-[var(--color-text-muted)] relative z-10">Quick repeat billing</div>
        </button>
      </div>

      {/* Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col gap-4">
          <Card className="p-6 flex flex-col justify-center bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-transparent border-indigo-100 dark:border-indigo-900/50 flex-1">
            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">Total Revenue (All Time)</div>
            <div className="text-3xl lg:text-4xl font-black text-indigo-700 dark:text-indigo-400 tracking-tight">
              {formatINR(totalRevenue)}
            </div>
            <div className="text-xs text-indigo-500/70 dark:text-indigo-400/50 mt-2 font-medium">
              Across {invoiceRepository.getAll().length} total invoices
            </div>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 flex flex-col justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-transparent border-emerald-100 dark:border-emerald-900/50">
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Paid</div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 truncate" title={formatINR(totalPaid)}>{formatINR(totalPaid)}</div>
            </Card>
            <Card className="p-4 flex flex-col justify-center bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-transparent border-rose-100 dark:border-rose-900/50">
              <div className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">Unpaid</div>
              <div className="text-lg font-bold text-rose-700 dark:text-rose-400 truncate" title={formatINR(totalUnpaid)}>{formatINR(totalUnpaid)}</div>
            </Card>
          </div>
        </div>
        
        <Card className="p-4 lg:col-span-2 h-[200px] lg:h-auto lg:min-h-[220px]">
          <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-4 ml-2 uppercase tracking-wider">Revenue Trend (Last 6 Months)</div>
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
          className="text-xs text-[var(--color-primary)] hover:underline"
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
            return (
              <div
                key={inv.id}
                className="group flex items-center gap-4 px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary-300)] hover:shadow-sm transition-all animate-fade-in-up"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: biz?.accentColor ? `${biz.accentColor}20` : 'var(--color-primary-50)' }}>
                  <FileText size={18} style={{ color: biz?.accentColor ?? 'var(--color-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{inv.customerName}</span>
                    <Badge variant="default" className="text-xs shrink-0">{inv.invoiceNumber}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-0.5">
                    <span className="flex items-center gap-1"><Calendar size={10} />{inv.invoiceDate}</span>
                    {biz && <span className="truncate">{biz.name}</span>}
                  </div>
                </div>
                <div className="text-sm font-bold text-[var(--color-text-primary)] shrink-0">{formatINR(inv.grandTotal)}</div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleView(inv)}
                    className="h-7 w-7 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition-all"
                    title="View/Edit"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="h-7 w-7 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
