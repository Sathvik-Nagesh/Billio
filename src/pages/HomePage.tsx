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

export function HomePage() {
  const navigate = useNavigate();
  const { businesses, activeBusiness } = useBusinessStore();
  const { resetForm, loadInvoice } = useInvoiceStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const all = invoiceRepository.getAll().slice(0, 20);
    setInvoices(all);
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
          items: (fullDup.items ?? []).map(i => ({ id: i.id, srNo: i.srNo, slNo: i.slNo ?? '', productName: i.productName, isbn: i.isbn ?? '', quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
          discountType: fullDup.discountType,
          discountValue: fullDup.discountValue,
          invoiceLanguage: fullDup.invoiceLanguage,
          templateId: fullDup.templateId ?? 'minimal-modern',
          themeOverrides: fullDup.themeOverrides ?? {},
          status: 'draft' as const,
          showIsbn: hasIsbnData || fullDup.templateId === 'publication-focus',
          showSlNo: hasSlNoData,
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
      items: (full.items ?? []).map(i => ({ id: i.id, srNo: i.srNo, slNo: i.slNo ?? '', productName: i.productName, isbn: i.isbn ?? '', quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
      discountType: full.discountType,
      discountValue: full.discountValue,
      invoiceLanguage: full.invoiceLanguage,
      templateId: full.templateId ?? 'minimal-modern',
      themeOverrides: full.themeOverrides ?? {},
      status: full.status,
      showIsbn: hasIsbnData || full.templateId === 'publication-focus',
      showSlNo: hasSlNoData,
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

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Invoices', value: invoices.length.toString(), sub: 'all time' },
          { label: 'This Month', value: invoices.filter(i => i.invoiceDate.startsWith(new Date().toISOString().slice(0, 7))).length.toString(), sub: 'invoices created' },
          { label: 'Revenue (Month)', value: formatINR(invoices.filter(i => i.invoiceDate.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, i) => s + i.grandTotal, 0)), sub: 'grand total billed' },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <div className="text-xs text-[var(--color-text-muted)] mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</div>
            <div className="text-xs text-[var(--color-text-muted)]">{stat.sub}</div>
          </Card>
        ))}
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
